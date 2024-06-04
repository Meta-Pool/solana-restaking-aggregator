use anchor_lang::prelude::*;
use crate::common_vault_strategy_state::CommonVaultStrategyState;

use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
// permissionless
pub struct UpdateLstAmount<'info> {
    #[account(mut, has_one = lst_mint)]
    pub strat_state: Account<'info, CommonVaultStrategyState>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &strat_state.key().to_bytes(),
            crate::AUTH_SEED
        ],
        bump
    )]
    pub strat_pda_auth: UncheckedAccount<'info>,

    /// ATA lst account
    #[account(
        associated_token::mint = lst_mint, 
        associated_token::authority = strat_pda_auth
    )]
    pub strat_lst_account: Account<'info, TokenAccount>,

}

pub fn handle_update_lst_amount(ctx: Context<UpdateLstAmount>) -> Result<()> {
    // see if some nice soul donated to our lst ata account
    // Phase 1. Collect values
    let actual_lst_amount = ctx.accounts.strat_lst_account.amount;
    let old_lst_amount = ctx.accounts.strat_state.locally_stored_amount;
    let (profit, slashing) = {
        // Phase 2. ?
        if actual_lst_amount >= old_lst_amount {
            // Phase 3. Profit!
            (actual_lst_amount - old_lst_amount, 0)
        } else {
            // slashed? :(
            (0, old_lst_amount - actual_lst_amount)
        }
    };

    // update locally_stored_amount
    ctx.accounts.strat_state.locally_stored_amount =
        ctx.accounts.strat_state.strat_total_lst_amount + profit - slashing;

    // update strat_total_lst_amount
    ctx.accounts.strat_state.strat_total_lst_amount =
        ctx.accounts.strat_state.strat_total_lst_amount + profit - slashing;

    emit!(crate::events::UpdateStratLstAmountEvent {
        strat_state: ctx.accounts.strat_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        old_lst_amount,
        profit,
        slashing,
    });

    Ok(())
}
