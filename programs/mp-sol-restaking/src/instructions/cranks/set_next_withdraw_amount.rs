use crate::{constants::*, error::ErrorCode, MainVaultState, VaultStrategyRelationEntry};
use anchor_lang::prelude::*;

#[derive(Accounts)]
/// signal the strategy how much lst we need to withdraw
pub struct SetNextWithdrawAmount<'info> {
    #[account(has_one = operator_auth)]
    pub main_state: Account<'info, MainVaultState>,

    // the one in main_state
    #[account()]
    pub operator_auth: Signer<'info>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the system
    #[account(mut,
        has_one = main_state,
        has_one = lst_mint,
        has_one = common_strategy_state,
        seeds = [
            VAULT_STRAT_ENTRY_SEED,
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strategy_relation_entry: Account<'info, VaultStrategyRelationEntry>,

    /// must be the one mentioned in vault_strategy_relation_entry
    /// CHECK: external acc manually deserialized
    pub common_strategy_state: UncheckedAccount<'info>,
}

pub fn handle_set_next_withdraw_amount(
    ctx: Context<SetNextWithdrawAmount>,
    lst_amount: u64,
) -> Result<()> {
    require_gt!(lst_amount, 0, ErrorCode::AmountIsZero);
    // set field next_withdraw_lst_amount
    ctx.accounts
        .vault_strategy_relation_entry
        .next_withdraw_lst_amount = lst_amount;
    Ok(())
}
