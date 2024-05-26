use crate::{
    external::common_vault_strategy_state::CommonVaultStrategyState, util::{check_price_not_stale, lst_amount_to_sol_value}, MainVaultState, SecondaryVaultState, VaultStrategyRelationEntry
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
/// permissionless
/// check how much lst is now in the strategy
/// if more lst than before => yield
pub struct UpdateAttachedStratLstAmount<'info> {
    #[account(mut)]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    #[account(mut,
        has_one = lst_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    /// secondary-vault state
    pub vault_state: Account<'info, SecondaryVaultState>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the vault
    #[account(
        has_one = common_strategy_state,
        seeds = [
            &vault_state.key().to_bytes(),
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strategy_relation_entry: Account<'info, VaultStrategyRelationEntry>,

    /// must be the one mentioned in vault_strategy_relation_entry
    #[account( has_one = lst_mint )]
    pub common_strategy_state: Account<'info, CommonVaultStrategyState>,
}

pub fn handle_update_attached_strat_lst_amount(
    ctx: Context<UpdateAttachedStratLstAmount>,
) -> Result<()> {
    //
    // see if the strat has now more lst than before
    //
    // Phase 1. Collect values
    let last_read_lst_amount = ctx
        .accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_amount;

    let strat_reported_lst_amount = ctx.accounts.common_strategy_state.strat_total_lst_amount;

    let (profit, slashing) = {
        // Phase 2. ?
        if strat_reported_lst_amount >= last_read_lst_amount {
            // Phase 3. Profit!
            (strat_reported_lst_amount - last_read_lst_amount, 0)
        } else {
            // slashed? :(
            (0, last_read_lst_amount - strat_reported_lst_amount)
        }
    };

    // if the amount of LSTs changed, update accounting in the secondary_vault
    // add to the total
    ctx.accounts.vault_state.vault_total_lst_amount = 
        ctx.accounts.vault_state.vault_total_lst_amount + profit - slashing;
    // but it is in an strategy
    ctx.accounts.vault_state.in_strategies_amount = 
        ctx.accounts.vault_state.in_strategies_amount + profit - slashing;

    // compute profit/slashing in terms of SOL-value, to update main-state backing_sol_value
    // LST/SOL price must not be stale
    check_price_not_stale(ctx.accounts.vault_state.lst_sol_price_timestamp)?;
    let profit_sol_value = lst_amount_to_sol_value(profit, ctx.accounts.vault_state.lst_sol_price_p32);
    let slashing_sol_value = lst_amount_to_sol_value(slashing, ctx.accounts.vault_state.lst_sol_price_p32);

    // update main_state.backing_sol_value with delta sol-value
    ctx.accounts.main_state.backing_sol_value =
        ctx.accounts.main_state.backing_sol_value + profit_sol_value - slashing_sol_value;

    // to finalize:
    // update last read amount and timestamp in vault_strategy_relation_entry
    ctx.accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_amount = strat_reported_lst_amount;
    ctx.accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_timestamp = Clock::get().unwrap().unix_timestamp as u64;

    emit!(crate::events::UpdateAttachedStratLstAmountEvent {
        main_state: ctx.accounts.main_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        vault_strategy_relation_entry: ctx.accounts.vault_strategy_relation_entry.key(),
        old_lst_amount: last_read_lst_amount,
        new_lst_amount: strat_reported_lst_amount,
        lst_price_p32: ctx.accounts.vault_state.lst_sol_price_p32,
        main_vault_backing_sol_value: ctx.accounts.main_state.backing_sol_value,
    });

    Ok(())
}
