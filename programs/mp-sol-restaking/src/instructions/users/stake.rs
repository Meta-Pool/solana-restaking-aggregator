use crate::util::{
    check_price_not_stale, lst_amount_to_sol_value, sol_value_to_mpsol_amount, TWO_POW_32,
};
use crate::{constants::*, error::ErrorCode, MainVaultState, SecondaryVaultState};
/// Stake any of the supported LST tokens
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(Accounts)]
/// Stake a LST in one of the secondary vaults
/// get mpSOL minted for the SOL-value of the deposit
pub struct Stake<'info> {
    #[account(mut, has_one = mpsol_mint)]
    pub main_state: Account<'info, MainVaultState>,

    #[account()]
    pub lst_mint: Box<Account<'info, Mint>>,

    #[account(mut, has_one=lst_mint, has_one=vault_lst_account,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    pub vault_state: Account<'info, SecondaryVaultState>,
    /// CHECK: Vaults ATA PDA Auth
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_ATA_AUTH_SEED
        ],
        bump
    )]
    pub vaults_ata_pda_auth: UncheckedAccount<'info>,
    #[account(mut, 
        associated_token::mint = lst_mint, 
        associated_token::authority = vaults_ata_pda_auth
    )]
    // where the lst tokens are stored while not in strategies
    pub vault_lst_account: Account<'info, TokenAccount>,

    #[account()]
    pub depositor: Signer<'info>,
    #[account(mut, token::mint = lst_mint, token::authority = depositor)]
    pub depositor_lst_account: Account<'info, TokenAccount>,

    #[account(mut, mint::authority = mpsol_mint_authority)]
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
}

/// amount is an lst amount
pub fn handle_stake(ctx: Context<Stake>, lst_amount: u64) -> Result<()> {
    // check deposits are enabled in this secondary-vault
    require_eq!(
        ctx.accounts.vault_state.deposits_disabled,
        false,
        ErrorCode::DepositsInThisVaultAreDisabled
    );
    // check amount > MIN_MOVEMENT_LAMPORTS
    require_gte!(lst_amount, MIN_MOVEMENT_LAMPORTS, ErrorCode::DepositAmountToSmall);

    // check token_sol_price is in range and not stale
    // LST/SOL price must be > 1
    require_gt!(
        ctx.accounts.vault_state.lst_sol_price_p32,
        TWO_POW_32,
        ErrorCode::InvalidStoredLstPrice
    );
    // LST/SOL price must not be stale
    check_price_not_stale(ctx.accounts.vault_state.lst_sol_price_timestamp)?;

    // compute the sol value of deposited LSTs
    let deposited_sol_value =
        lst_amount_to_sol_value(lst_amount, ctx.accounts.vault_state.lst_sol_price_p32);
    // check Sol-value > MIN_MOVEMENT_LAMPORTS
    require_gte!(
        deposited_sol_value,
        MIN_MOVEMENT_LAMPORTS,
        ErrorCode::DepositAmountToSmall
    );

    // how much mpSOL is sol_value_deposited, at current price
    // Note: do this computation before altering main_vault_backing_sol_value
    let mpsol_amount = sol_value_to_mpsol_amount(
        deposited_sol_value,
        ctx.accounts.main_state.backing_sol_value,
        ctx.accounts.mpsol_mint.supply,
    );

    // Transfer tokens to vault account
    {
        let transfer_instruction = Transfer {
            from: ctx.accounts.depositor_lst_account.to_account_info(),
            to: ctx.accounts.vault_lst_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        anchor_spl::token::transfer(cpi_ctx, lst_amount)?;
    }
    // the tokens are added to locally stored amount
    ctx.accounts.vault_state.locally_stored_amount += lst_amount;

    ctx.accounts.vault_state.check_cap()?;

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
        mpsol_amount,
    )?;

    // -------
    // keep contract internal accounting
    // -------
    // keep the total deposited sol value in vault_state
    ctx.accounts.vault_state.vault_total_sol_value += deposited_sol_value;
    // also the global sum for all vaults
    // by adding to main_state.backing_sol_value, mpSOL price remains the same after the mint
    ctx.accounts.main_state.backing_sol_value += deposited_sol_value;

    emit!(crate::events::StakeEvent {
        main_state: ctx.accounts.main_state.key(),
        depositor: ctx.accounts.depositor.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        lst_amount,
        deposited_sol_value,
        depositor_lst_account: ctx.accounts.depositor_lst_account.key(),
        depositor_mpsol_account: ctx.accounts.depositor_mpsol_account.key(),
        mpsol_received: mpsol_amount,
        //--- mpSOL price components after the stake
        main_vault_backing_sol_value: ctx.accounts.main_state.backing_sol_value,
        mpsol_supply: ctx.accounts.mpsol_mint.supply + mpsol_amount,
    });

    Ok(())
}
