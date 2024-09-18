use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UnstakeTicket {
    pub main_state: Pubkey,
    /// auth that can withdraw the LSTs when due
    pub beneficiary: Pubkey,
    /// amount (lamports) this ticket is worth (set at unstake) -- can be updated on partial ticket withdraws
    pub ticket_sol_value: u64,
    /// when this ticket is due (unix timestamp)
    pub ticket_due_timestamp: u64,
}
