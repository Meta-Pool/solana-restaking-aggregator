use anchor_lang::prelude::*;
#[event]
pub struct StakeEvent {
    pub main_state: Pubkey,
    pub token_mint: Pubkey,
    pub depositor: Pubkey,
    pub lst_amount: u64,
    pub deposited_sol_value: u64,
    pub depositor_lst_account: Pubkey,
    pub depositor_mpsol_account: Pubkey,
    pub mpsol_received: u64,
    pub deposit_fee: u64,
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
