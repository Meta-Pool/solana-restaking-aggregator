use crate::{constants::*, MainVaultState};
/// Stake any of the supported LST tokens
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::spl_token::instruction::AuthorityType;
use anchor_spl::token::{Mint, SetAuthority, Token};

#[derive(Accounts)]
/// Init: Only-once, make sure the mint freeze auth is None
pub struct RemoveFreezeAuth<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(has_one = mpsol_mint, has_one = admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mut,
        mint::authority = mpsol_mint_authority
    )]
    pub mpsol_mint: Box<Account<'info, Mint>>,
    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            MAIN_VAULT_MINT_AUTH_SEED
        ],
        bump
    )]
    pub mpsol_mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_remove_freeze_auth(ctx: Context<RemoveFreezeAuth>) -> Result<()> {
    // set mpSOL mint freeze authority to NONE
    anchor_spl::token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                current_authority: ctx.accounts.mpsol_mint_authority.to_account_info(),
                account_or_mint: ctx.accounts.mpsol_mint.to_account_info(),
            },
            &[&[
                &ctx.accounts.main_state.key().to_bytes(),
                MAIN_VAULT_MINT_AUTH_SEED,
                &[ctx.bumps.mpsol_mint_authority],
            ]],
        ),
        AuthorityType::FreezeAccount,
        None,
    )?;

    Ok(())
}
