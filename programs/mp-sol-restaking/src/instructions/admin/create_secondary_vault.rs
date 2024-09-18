use crate::state::MainVaultState;
use crate::{constants::*, SecondaryVaultState};
use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};

/// Note: Before adding a secondary vault
/// THE CONTRACT CODE OF THE LST HAS TO BE VERIFIED
/// Adding the LST means adding sol-value to the main vault
/// so it is important to ensure that the LST is a valid LST
/// with full SOL backing and permissionless unstake
#[derive(Accounts)]
pub struct CreateSecondaryVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mint::decimals = 9)]
    // all LST mints must have 9 decimals, to simplify x/SOL price calculations
    pub lst_mint: Account<'info, Mint>,

    // secondary vaults are PDAs of main_state
    // only this program & main_state can create a secondary vault
    #[account(init, payer = admin, space = 8 + SecondaryVaultState::INIT_SPACE,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    pub vault_state: Account<'info, SecondaryVaultState>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_ATA_AUTH_SEED
        ],
        bump
    )]
    pub vaults_ata_pda_auth: UncheckedAccount<'info>,

    #[account(
        associated_token::mint = lst_mint,
        associated_token::authority = vaults_ata_pda_auth
    )]
    pub vault_lst_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_secondary_vault(ctx: Context<CreateSecondaryVault>) -> Result<()> {
    ctx.accounts.vault_state.set_inner(SecondaryVaultState {
        lst_mint: ctx.accounts.lst_mint.key(),
        vault_total_lst_amount: 0,
        lst_sol_price_p32: 0,
        lst_sol_price_timestamp: 0,
        in_strategies_amount: 0,
        locally_stored_amount: 0,
        tickets_target_sol_amount: 0,
        deposits_disabled: true,
        token_deposit_cap: 0,
    });
    Ok(())
}
