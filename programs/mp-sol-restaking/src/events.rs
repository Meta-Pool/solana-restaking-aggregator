use anchor_lang::prelude::*;
#[event]
pub struct StakeEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub depositor: Pubkey,
    pub ref_code: u32, 
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
pub struct UpdateVaultTokenSolPriceEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub lst_amount: u64,
    pub old_price_p32: u64,
    pub old_sol_value: u64,
    pub new_price_p32: u64,
    pub new_sol_value: u64,
    pub main_vault_backing_sol_value: u64,
}

#[event]
pub struct UpdateAttachedStratLstAmountEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub vault_strategy_relation_entry: Pubkey,
    pub old_lst_amount: u64,
    pub new_lst_amount: u64,
    pub lst_price_p32: u64,
    pub main_vault_backing_sol_value: u64,
}

#[event]
pub struct TicketClaimEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub ticket_account: Pubkey,
    pub beneficiary: Pubkey,
    pub claimed_sol_value: u64,
    pub ticket_sol_value_remaining: u64,
    pub lst_amount_delivered: u64,
    pub ticket_due_timestamp: u64,
}

#[event]
pub struct TransferLstToStratEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub vault_strategy_relation_entry: Pubkey,
    pub lst_amount: u64,
}

#[event]
pub struct GetLstFromStratEvent {
    pub main_state: Pubkey,
    pub lst_mint: Pubkey,
    pub vault_strategy_relation_entry: Pubkey,
    pub desired_amount: u64,
    pub existent_amount: u64,
    pub lst_amount: u64,
}
