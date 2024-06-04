use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use shared_lib::{lst_amount_to_sol_value, sol_value_to_lst_amount};

use crate::error::ErrorCode;

// Secondary-vault State
#[account]
#[derive(InitSpace)]
/// vault-state address is PDA(main_state, token_mint)
pub struct SecondaryVaultState {
    /// the LST type stored in this vault
    pub lst_mint: Pubkey,

    /// LST-token/SOL price with 32-bit precision, cache of last computation of LST-token/SOL price,
    /// it is computed as `token_sol_price_p32 = LST-backing-lamports * 2^32 / LST-mint-supply`
    /// it is used to compute vault.sol_value.
    /// To obtain a human-readable price do: human_readable_price = token_sol_price_p32 / 2^32
    /// invariant: token_sol_price_p32 >= 2^32, because the min value for 1 LST is 1 SOL
    pub lst_sol_price_p32: u64,
    /// last computation of token_sol_price, price is obtained ON-CHAIN, read from the LST token program state
    pub lst_sol_price_timestamp: u64,

    /// total lst amount backing this vault_total_sol_value 
    /// To compute SOL value of the entire vault use: vault_total_lst_amount * lst_token_sol_price
    /// invariant: vault_total_token_amount = in_strategies_amount + locally_stored_amount
    pub vault_total_lst_amount: u64,

    /// token amount here (not in strategies)
    /// invariant: vault_total_lst_amount = in_strategies_amount + locally_stored_amount
    /// must eventually match vault_lst_ata (PDA ATA token account)
    pub locally_stored_amount: u64,

    /// token amount sent to strategies (belongs to this vault, part of assets, but not in vault_token_account)
    /// invariant: vault_total_lst_amount = in_strategies_amount + locally_stored_amount
    pub in_strategies_amount: u64,

    /// "tickets_target_sol_amount" is set by the ticket-fulfiller crank, so this vault removes tokens from strategies
    /// increasing "locally_stored_amount" until it covers "tickets_target_sol_amount"
    /// in order to compute how much tokens are free to send to strategies, you must use fn `available_for_strategies_amount()`
    /// that subtracts this value from locally_stored_amount
    pub tickets_target_sol_amount: u64,

    /// if true: only-withdraw mode
    pub deposits_disabled: bool,
    /// 0 means no cap - measured in vault accepted tokens
    pub token_deposit_cap: u64,

}

impl SecondaryVaultState {

    pub fn vault_total_sol_value(&self) -> u64 {
        lst_amount_to_sol_value(self.vault_total_lst_amount, self.lst_sol_price_p32)
    }

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
        self.vault_total_lst_amount == 0
            && self.locally_stored_amount == 0
            && self.in_strategies_amount == 0
            && self.tickets_target_sol_amount == 0
    }
}

