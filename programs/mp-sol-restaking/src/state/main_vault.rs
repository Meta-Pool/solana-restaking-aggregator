use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

use crate::util::{mul_div, ONE_BILLION};
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct MainVaultState {
    pub admin: Pubkey,
    pub operator_auth: Pubkey, // authority to set parameters, token_deposit_caps & whitelisted_strategies, normally a DAO-authorized bot acting on votes
    pub strategy_rebalancer_auth: Pubkey, // authority to move tokens in or out strategies, normally a DAO-authorized bot acting on votes

    pub mpsol_mint: Pubkey,
    #[max_len(MAX_WHITELISTED_VAULTS)]
    pub whitelisted_vaults: Vec<VaultEntry>,

    /// SOL-value backing the mpsol.supply
    /// mpSOL_price = backing_sol_value/mpsol.supply
    /// when an unstaking is requested, the mpSOL is burnt, the SOL-value is moved to outstanding_tickets_sol_value
    /// when a ticket is due and claimed, the SOL-value is removed from a vault to the user and then outstanding_tickets_sol_value is reduced
    /// invariant: sum(whitelisted_vaults.last_sol_value) = backing_sol_value + outstanding_tickets_sol_value
    /// When tokens are staked, backing_sol_value is incremented and mpSOL is minted: staking does not change mpSOL price.
    /// When rewards are computed in the vaults, backing_sol_value is increased, increasing mpSOL/SOL price
    pub backing_sol_value: u64,
    /// represents the sum of unstake-tickets created and not claimed yet
    pub outstanding_tickets_sol_value: u64,
}

impl MainVaultState {
    pub fn mpsol_price(&self, mpsol_supply: u64) -> u64 {
        mul_div(self.backing_sol_value, ONE_BILLION, mpsol_supply)
    }
}
/// secondary-vault entry in main-vault whitelist
#[account]
#[derive(InitSpace)]
pub struct VaultEntry {
    pub token_mint: Pubkey, // vault-state address is PDA(token_mint, VAULT_STATE_SEED)
    pub last_sol_value: u64, // must be reduced manually when tickets are claimed and sol-value removed from a vault, so price-update computes rewards properly
    pub last_sol_value_timestamp: u64, // last run of price-update
}
