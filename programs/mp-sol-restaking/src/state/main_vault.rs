use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct MainVaultState {
    // main admin, normally the DAO auth
    pub admin: Pubkey,
    /// authority to set parameters, token_deposit_caps & whitelisted_strategies, normally a DAO-authorized bot acting on votes
    pub operator_auth: Pubkey, 
    /// authority to move tokens in or out strategies, normally a DAO-authorized bot acting on votes
    pub strategy_rebalancer_auth: Pubkey, 

    pub mpsol_mint: Pubkey,

    /// SOL-value backing the mpsol.supply
    /// "SOL-value" is the estimation of the SOL backing all the LSTs stored in the vaults
    /// A "SOL-value" of 100 SOL can be represented by LST-amount, as long as `LST-amount * LST/SOL-price = SOL-value`
    /// meaning if you have a SOL-value of 100, you could withdraw 98.2 mSOL from the assets, or 92.1 JitoSOL, etc.
    /// mpSOL_price = backing_sol_value/mpSOL.supply
    /// When tokens are staked, backing_sol_value is incremented and mpSOL is minted: staking does not change mpSOL price.
    /// When rewards are computed in the vaults, backing_sol_value is increased, increasing mpSOL/SOL price
    pub backing_sol_value: u64,
    /// represents the sum of unstake-tickets created and not claimed yet
    /// When an unstaking is requested, the mpSOL is burned and the SOL-value is moved to "outstanding_tickets_sol_value"
    /// When a ticket is due and claimed (total or partially), the SOL-value is sent from a vault to the user 
    /// and then `outstanding_tickets_sol_value is` reduced
    /// invariant: sum(whitelisted_vaults.last_sol_value) = backing_sol_value + outstanding_tickets_sol_value
    pub outstanding_tickets_sol_value: u64,

    // Config:
    /// normally 48: number of hours for a ticket to be due 
    pub unstake_ticket_waiting_hours: u16, 

    #[max_len(MAX_WHITELISTED_VAULTS)]
    pub whitelisted_vaults: Vec<VaultEntry>,
}

/// secondary-vault entry in main-vault whitelist
#[account]
#[derive(InitSpace)]
pub struct VaultEntry {
    /// LST token ming, must have mint:decimals=9 
    /// secondary-vault-state address is PDA(main_state, lst_mint)
    pub lst_mint: Pubkey, 
    /// last computation of SOL-value in the secondary-vault. 
    /// Includes backing_sol_value and SOL-value reserved for unstake-tickets
    /// Incremented when depositing the LST token and minting mpSOL in such a way that mpSOL price does not change
    /// Reduced manually when tickets are claimed and sol-value removed from this vault, so the next price-update computes rewards properly
    /// Incremented during price-update, if the LSTs generated yield, either by themselves or by strategies
    /// The increment during price-update also goes to main_vault.backing_sol_value, increasing mpSOL price
    pub last_computed_sol_value: u64, 
    pub last_computed_sol_value_timestamp: u64, // last run of price-update. last_sol_value is incremented when the LSTs generate yield, either by themselves or by strategies
}
