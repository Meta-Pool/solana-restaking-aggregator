use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

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
    pub treasury_mpsol_account: Option<Pubkey>,
    pub performance_fee_bp: u16,

    /// SOL-value backing the mpsol.supply
    /// "SOL-value" is the estimation of the SOL backing all the LSTs stored in the vaults
    /// A "SOL-value" of 100 SOL can be represented by some LST-amount, as long as `LST-amount * LST/SOL-price = SOL-value`
    /// meaning if you have a SOL-value ticket of 100, you could withdraw 98.2 mSOL from the assets, or 92.1 JitoSOL, etc. 
    /// mpSOL_price = backing_sol_value/mpSOL.supply
    /// When tokens are staked, backing_sol_value is incremented and mpSOL is minted: staking does not change mpSOL price.
    /// When rewards are computed in the vaults, backing_sol_value is increased, increasing mpSOL/SOL price
    /// invariant: sum(secondary_vault.vault_total_sol_value) = backing_sol_value + outstanding_tickets_sol_value
    pub backing_sol_value: u64,

    /// represents the sum of unstake-tickets created and not claimed yet
    /// When an unstaking is requested, the mpSOL is burned and the SOL-value is moved to "outstanding_tickets_sol_value"
    /// When a ticket is due and claimed (total or partially), the SOL-value is sent from a vault to the user 
    /// and then `outstanding_tickets_sol_value is` reduced
    /// invariant: sum(secondary_vault.vault_total_sol_value) = backing_sol_value + outstanding_tickets_sol_value
    pub outstanding_tickets_sol_value: u64,

    // Config:
    /// normally 48: number of hours for a ticket to be due 
    pub unstake_ticket_waiting_hours: u16, 

}
