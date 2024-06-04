use anchor_lang::prelude::*;
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
