use anchor_lang::prelude::*;
#[derive(Debug)]
#[event]
pub struct StakeEvent {
    pub main_state: Pubkey,
    pub token_mint: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub deposited_sol_value: u64,
    pub depositor_lst_account: Pubkey,
    pub depositor_mpsol_account: Pubkey,
    pub mpsol_received: u64,
    pub deposit_fee: u64,
    //--- mpSOL price used
    pub main_vault_backing_sol_value: u64,
    pub mpsol_supply: u64,
}
