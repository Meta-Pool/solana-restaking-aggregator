use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

use crate::error::ErrorCode;
use crate::util::sol_value_to_lst_amount;

// Secondary-vault State
#[account]
#[derive(InitSpace)]
/// vault-state address is PDA(main_state, token_mint)
pub struct SecondaryVaultState {
    /// the LST type stored in this vault
    pub lst_mint: Pubkey,
    /// locally_stored_amount ls tokens are stored here
    pub vault_lst_account: Pubkey,

    /// LST-token/SOL price with 32-bit precision, cache of last computation of LST-token/SOL price,
    /// it is computed as `token_sol_price_p32 = LST-backing-lamports * 2^32 / LST-mint-supply`
    /// it is used to compute vault.sol_value.
    /// To obtain a human-readable price do: human_readable_price = token_sol_price_p32 / 2^32
    /// invariant: token_sol_price_p32 >= 2^32, because the min value for 1 LST is 1 SOL
    pub lst_sol_price_p32: u64,
    /// last computation of token_sol_price, price is obtained ON-CHAIN, read from the LST token program state
    pub lst_sol_price_timestamp: u64,

    /// SOL value of the entire vault, vault_total_token_amount * lst_token_sol_price
    pub vault_total_sol_value: u64,

    /// token amount here (not in strategies)
    /// invariant: vault_token_amount = in_strategies_amount + locally_stored_amount
    /// invariant: vault_token_amount = vault_token_account.amount
    pub locally_stored_amount: u64,

    /// token amount sent to strategies (belongs to this vault, part of assets, but not in vault_token_account)
    /// invariant: vault_token_amount = in_strategies_amount + locally_stored_amount
    pub in_strategies_amount: u64,

    /// total token amount backing the vault_total_sol_value of this vault
    /// invariant: vault_total_token_amount = in_strategies_amount + locally_stored_amount
    pub vault_total_lst_amount: u64,

    /// "tickets_target_sol_amount" is set by the ticket-fulfiller crank, so this vault removes tokens from strategies
    /// increasing "locally_stored_amount" until it covers "tickets_target_sol_amount"
    /// in order to compute how much tokens are free to send to strategies, you must use fn `available_for_strategies_amount()`
    /// that subtracts this value from locally_stored_amount
    pub tickets_target_sol_amount: u64,

    /// if true: only-withdraw mode
    pub deposits_disabled: bool,
    /// 0 means no cap - measured in vault accepted tokens
    pub token_deposit_cap: u64,

    #[max_len(32)]
    pub whitelisted_strategies: Vec<StrategyEntry>,
}

impl SecondaryVaultState {
    pub fn available_for_strategies_amount(&self) -> u64 {
        self.locally_stored_amount
            .saturating_sub(sol_value_to_lst_amount(
                self.tickets_target_sol_amount,
                self.lst_sol_price_p32,
            ))
    }

    pub fn check_cap(&self) -> Result<()> {
        if self.token_deposit_cap > 0 {
            require_gte!(
                self.token_deposit_cap,
                self.locally_stored_amount + self.in_strategies_amount,
                ErrorCode::DepositExceedsVaultCap
            );
        }
        Ok(())
    }

    pub fn is_empty(&self) -> bool {
        self.vault_total_sol_value == 0
            && self.locally_stored_amount == 0
            && self.in_strategies_amount == 0
            && self.tickets_target_sol_amount == 0
    }
}

/// secondary-vault entry in main-vault whitelist
#[account]
#[derive(InitSpace)]
pub struct StrategyEntry {
    pub strategy_program: Pubkey,
    pub strategy_state_account: Pubkey,
    /// last computation of lst-tokens in the strategy.
    /// Incremented when depositing the LST token in the strategy
    /// Reduced manually when removing LST tokens from the strategy
    /// Incremented during strategy-amount-update, if the strategy generated yield in the form of more lst tokens
    /// The increment during strategy-amount-update also goes to in_strategies_amount and vault_total_amount,
    /// later incrementing vault_total_sol_value, and by that increasing mpSOL price
    pub last_computed_stored_lst_amount: u64,
    pub last_computed_stored_lst_timestamp: u64, // last run of strat-price-update
}
