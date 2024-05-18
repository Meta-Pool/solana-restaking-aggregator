use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

use crate::error::ErrorCode;
use crate::util::sol_value_to_token_amount;

// Secondary-vault State
#[account]
#[derive(InitSpace)]
pub struct SecondaryVaultState {
    pub token_mint: Pubkey,
    pub vault_token_account: Pubkey, // locally_stored_amount tokens are here
    pub vault_token_amount: u64, // invariant: vault_token_amount = in_strategies_amount + locally_stored_amount
    pub token_sol_price: u64, // token/SOL price*1e9, cache of last computation of token/SOL price, used to compute vault.sol_value, invariant: token_sol_price>=1e9
    pub token_sol_price_timestamp: u64, // last computation of token_sol_price
    pub sol_value: u64,       // SOL value of the entire vault, vault_token_amount * token_sol_price
    pub in_strategies_amount: u64, // token amount sent to strategies
    pub locally_stored_amount: u64, // token amount not in strategies, invariant: vault_token_amount = in_strategies_amount + locally_stored_amount
    /// note: set by the ticket-fulfiller crank, so this vault removes tokens from strategies
    /// increasing locally_stored_amount until it covers tickets_target_sol_amount
    /// in order to compute how much tokens are free to send to strategies, you must use available_for_strategies_amount()
    /// that subtracts this value from locally_stored_amount
    pub tickets_target_sol_amount: u64,
    pub deposits_disabled: bool,   // only-withdraw mode
    pub token_deposit_cap: u64,    // 0 means no cap - measure in vault accepted tokens
    #[max_len(32)]
    pub whitelisted_strategies: Vec<StrategyEntry>,
}

impl SecondaryVaultState {
    pub fn available_for_strategies_amount(&self) -> u64 {
        self.locally_stored_amount
            .saturating_sub(sol_value_to_token_amount(
                self.tickets_target_sol_amount,
                self.token_sol_price,
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
        self.sol_value == 0
            && self.locally_stored_amount == 0
            && self.in_strategies_amount == 0
            && self.tickets_target_sol_amount == 0
    }
}

/// secondary-vault entry in main-vault whitelist
#[account]
#[derive(InitSpace)]
pub struct StrategyEntry {
    pub strategy_state_account: Pubkey,
    pub last_sol_value: u64, // the strategies publish the sol value of the tokens they've received. Increases in SOL value represent the strategy yield
    pub last_sol_value_timestamp: u64, // last run of strat-price-update
}
