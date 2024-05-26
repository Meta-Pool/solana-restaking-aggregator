use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::common_vault_strategy_state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Create a new CommonVaultStrategyState
    #[account(init, payer = admin, space = 8 + CommonVaultStrategyState::INIT_SPACE)]
    pub strat_state: Account<'info, CommonVaultStrategyState>,

    #[account(mint::decimals = 9)]
    // all LST mints must have 9 decimals, to simplify x/SOL price calculations
    pub lst_mint: Account<'info, Mint>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &strat_state.key().to_bytes(),
            AUTH_SEED
        ],
        bump
    )]
    pub strat_pda_auth: UncheckedAccount<'info>,

    /// create an ATA lst account for the strat to store LSTs, auth is strat_pda_auth
    #[account(init, payer = admin, 
        associated_token::mint = lst_mint, 
        associated_token::authority = strat_pda_auth
    )]
    pub strat_lst_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.strat_state.set_inner(CommonVaultStrategyState {
        lst_mint: ctx.accounts.lst_mint.key(),
        strat_total_lst_amount: 0,
        locally_stored_amount: 0,
        in_external_program_amount: 0,
    });
    Ok(())
}
