use crate::util::{apply_bp, check_price_not_stale, sol_value_to_token_amount, token_to_sol_value};
use crate::{constants::*, error::ErrorCode, MainVaultState, SecondaryVaultState};
/// Stake any of the supported LST tokens
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::{mint_to, MintTo, TokenAccount, Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub main_state: Account<'info, MainVaultState>,

    #[account()]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(mut, has_one=token_mint, has_one=vault_token_account)]
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
    #[account(mut, associated_token::mint = token_mint, associated_token::authority = vaults_ata_pda_auth)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub depositor: Signer<'info>,
    #[account(mut, token::mint = token_mint, token::authority = depositor)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
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

    #[account(mut, token::mint = mpsol_mint, token::authority = depositor)]
    pub depositor_mpsol_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    // check deposits are enabled
    require_eq!(
        ctx.accounts.vault_state.deposits_disabled,
        false,
        ErrorCode::DepositsInThisVaultAreDisabled
    );
    // check amount
    require_gte!(amount, MIN_DEPOSIT_UNITS, ErrorCode::DepositAmountToSmall);

    // check token_sol_price is not stale
    check_price_not_stale(ctx.accounts.vault_state.token_sol_price_timestamp)?;

    // compute sol value
    let deposited_sol_value = token_to_sol_value(amount, ctx.accounts.vault_state.token_sol_price);
    require_gte!(
        deposited_sol_value,
        MIN_DEPOSIT_UNITS,
        ErrorCode::DepositAmountToSmall
    );

    // keep the total deposited sol value in vault_state
    ctx.accounts.vault_state.sol_value += deposited_sol_value;
    // also global for all vaults
    //ctx.accounts.main_state.sol_value += deposited_sol_value;

    // Transfer tokens to vault account
    {
        let transfer_instruction = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;
    }

    // the tokens are added to locally stored amount
    ctx.accounts.vault_state.locally_stored_amount += amount;

    ctx.accounts.vault_state.check_cap()?;

    // how much mpSOL is sol_value_deposited
    let mpsol_amount = sol_value_to_token_amount(
        deposited_sol_value,
        ctx.accounts
            .main_state
            .mpsol_price(ctx.accounts.mpsol_mint.supply),
    );

    // discount deposit fee, to avoid attack vectors
    let deposit_fee = apply_bp(mpsol_amount, ctx.accounts.main_state.deposit_fee_bp);
    // deposit fee is not minted, so it slightly raises mpSOL price

    msg!(
        "deposited_sol_value:{}, mpsol_amount:{}, mpsol_mint.supply:{} backing_sol_value:{} deposit_fee:{}",
        deposited_sol_value,
        mpsol_amount,
        ctx.accounts.mpsol_mint.supply,
        ctx.accounts.main_state.backing_sol_value,
        deposit_fee,
    );
    // mint mpSOL for the user
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mpsol_mint.to_account_info(),
                to: ctx.accounts.depositor_mpsol_account.to_account_info(),
                authority: ctx.accounts.mpsol_mint_authority.to_account_info(),
            },
            &[&[
                &ctx.accounts.main_state.key().to_bytes(),
                MAIN_VAULT_MINT_AUTH_SEED,
                &[ctx.bumps.mpsol_mint_authority],
            ]],
        ),
        mpsol_amount - deposit_fee,
    )
}
