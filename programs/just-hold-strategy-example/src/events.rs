use anchor_lang::prelude::*;
#[event]
pub struct StakeEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub depositor: Pubkey,
    pub lst_amount: u64,
    pub deposited_sol_value: u64,
    pub depositor_lst_account: Pubkey,
    pub depositor_mpsol_account: Pubkey,
    pub mpsol_received: u64,
    //--- mpSOL price used
    pub main_vault_backing_sol_value: u64,
    pub mpsol_supply: u64,
}

#[event]
pub struct UnstakeEvent {
    pub main_state: Pubkey,
    pub unstaker: Pubkey,
    pub mpsol_amount: u64,
    pub unstaker_mpsol_account: Pubkey,
    pub mpsol_burned: u64,
    pub ticket_account: Pubkey,
    pub ticket_sol_value: u64,
    pub ticket_due_timestamp: u64,
    //--- mpSOL price used
    pub main_vault_backing_sol_value: u64,
    pub mpsol_supply: u64,
}

#[event]
pub struct UpdateStratLstAmountEvent {
    pub strat_state: Pubkey,
    pub lst_mint: Pubkey,
    /// amount before this event
    pub old_lst_amount: u64,
    /// profit lst amount discovered
    pub profit: u64,
    /// slashing lst amount discovered
    pub slashing: u64,
}
