use crate::state::MainVaultState;
use crate::{constants::*, SecondaryVaultState};
use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct CreateSecondaryVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mint::decimals = 9)]
    // all mints must have 9 decimals, to simplify x/SOL price calculations
    pub token_mint: Account<'info, Mint>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_MANAGER_AUTH_SEED
        ],
        bump
    )]
    pub vaults_manager_pda_authority: UncheckedAccount<'info>,

    #[account(init, payer = admin, space = 8 + SecondaryVaultState::INIT_SPACE,
        seeds = [
            &main_state.key().to_bytes(),
            &token_mint.key().to_bytes(),
        ],
        bump
    )]
    pub secondary_state: Account<'info, SecondaryVaultState>,

    #[account(init, payer = admin, associated_token::mint = token_mint, associated_token::authority = vaults_manager_pda_authority)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_secondary_vault(ctx: Context<CreateSecondaryVault>) -> Result<()> {
    ctx.accounts.secondary_state.set_inner(SecondaryVaultState {
        token_mint: ctx.accounts.token_mint.key(),
        vault_token_account: ctx.accounts.vault_token_account.key(),
        vault_token_amount: 0,
        token_sol_price : 0,
        token_sol_price_timestamp : 0,
        sol_value : 0,
        in_strategies_amount : 0,
        locally_stored_amount : 0,
        tickets_target_sol_amount : 0,
        deposits_disabled : true,
        token_deposit_cap : 0,
        whitelisted_strategies : Vec::with_capacity(MAX_WHITELISTED_VAULT_STRATEGIES as usize),
    });
    Ok(())
}
