use crate::state::MainVaultState;
use crate::util::ONE_BILLION;
use crate::{constants::*, SecondaryVaultState};
use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct UpdateVaultTokenSolPrice<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mut,
        has_one = token_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &token_mint.key().to_bytes(),
        ],
        bump
    )]
    pub secondary_state: Account<'info, SecondaryVaultState>,

    #[account(mint::decimals = 9)]
    // all mints must have 9 decimals, to simplify x/SOL price calculations
    pub token_mint: Account<'info, Mint>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_ATA_AUTH_SEED
        ],
        bump
    )]
    pub vaults_ata_pda_auth: UncheckedAccount<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_update_vault_token_sol_price(ctx: Context<UpdateVaultTokenSolPrice>) -> Result<()> {
    ctx.accounts.secondary_state.token_sol_price = ONE_BILLION;
    Ok(())
}
