use crate::constants::*;
use crate::state::MainVaultState;
use anchor_lang::prelude::*;

use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(init, payer = admin, space = 8 + MainVaultState::INIT_SPACE)]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            MAIN_VAULT_MINT_AUTH_SEED
        ],
        bump
    )]
    pub mpsol_mint_pda_authority: UncheckedAccount<'info>,
    #[account(init,
        payer = admin,
        mint::decimals = 9, // all mints must have 9 decimals, to simplify x/SOL price calculations
        mint::authority = mpsol_mint_pda_authority,
        mint::freeze_authority = mpsol_mint_pda_authority
        )]
    pub mpsol_token_mint: Account<'info, Mint>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>, operator_auth:Pubkey, strategy_rebalancer_auth:Pubkey) -> Result<()> {
    ctx.accounts.main_state.set_inner(MainVaultState {
        admin: ctx.accounts.admin.key(),
        operator_auth,
        strategy_rebalancer_auth,
        mpsol_mint: ctx.accounts.mpsol_token_mint.key(),
        whitelisted_vaults: Vec::with_capacity(MAX_WHITELISTED_VAULTS as usize),
        backing_sol_value: 0,
        outstanding_tickets_sol_value: 0,
        deposit_fee_bp: 10,
        unstake_ticket_waiting_hours: 48,
    });
    Ok(())
}
