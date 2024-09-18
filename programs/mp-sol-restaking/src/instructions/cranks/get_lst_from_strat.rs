use crate::error::ErrorCode;
use crate::state::MainVaultState;
use crate::{constants::*, SecondaryVaultState, VaultStrategyRelationEntry};
use anchor_lang::prelude::*;

use anchor_spl::token::{Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct GetLstFromStrat<'info> {
    #[account()]
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

    /// CHECK: Vault Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_ATA_AUTH_SEED
        ],
        bump
    )]
    pub vaults_ata_pda_auth: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = lst_mint,
        associated_token::authority = vaults_ata_pda_auth
    )]
    pub vault_lst_account: Account<'info, TokenAccount>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the system
    #[account(mut,
        has_one = main_state,
        has_one = lst_mint,
        has_one = common_strategy_state,
        seeds = [
            VAULT_STRAT_ENTRY_SEED,
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strategy_relation_entry: Account<'info, VaultStrategyRelationEntry>,

    /// must be the one mentioned in vault_strategy_relation_entry
    /// CHECK: external acc manually deserialized
    pub common_strategy_state: UncheckedAccount<'info>,

    /// CHECK: get vault Auth PDA
    /// for temp-ATA to move lst from strat back to the vault
    #[account(
        seeds = [
            crate::VAULT_STRAT_WITHDRAW_ATA_AUTH_SEED,
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strat_withdraw_auth: UncheckedAccount<'info>,

    /// temp-ATA to move lst from strat back to the vault
    #[account(mut,
        associated_token::mint = lst_mint,
        associated_token::authority = vault_strat_withdraw_auth,
    )]
    lst_withdraw_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_get_lst_from_strat(ctx: Context<GetLstFromStrat>) -> Result<()> {
    let desired_amount = ctx
        .accounts
        .vault_strategy_relation_entry
        .next_withdraw_lst_amount;
    require_gt!(desired_amount, 0, ErrorCode::AmountIsZero);

    let existent_amount = ctx.accounts.lst_withdraw_account.amount;
    require_gt!(existent_amount, 0, ErrorCode::ExistingAmountIsZero);

    let lst_amount = std::cmp::min(existent_amount, desired_amount);

    // Transfer tokens from strat deposited temp lst account to vault account
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.lst_withdraw_account.to_account_info(),
                to: ctx.accounts.vault_lst_account.to_account_info(),
                authority: ctx.accounts.vault_strat_withdraw_auth.to_account_info(),
            },
            &[&[
                crate::VAULT_STRAT_WITHDRAW_ATA_AUTH_SEED,
                &ctx.accounts.common_strategy_state.key().to_bytes(),
                &[ctx.bumps.vault_strat_withdraw_auth],
            ]],
        ),
        lst_amount,
    )?;

    // compute as locally stored amount
    ctx.accounts.vault_state.locally_stored_amount += lst_amount;
    // no longer in strategies
    ctx.accounts.vault_state.in_strategies_amount -= lst_amount;

    // reset field next_withdraw_lst_amount
    ctx.accounts
        .vault_strategy_relation_entry
        .next_withdraw_lst_amount -= lst_amount;
    // this decrease of the strat lst amount is not a loss
    ctx.accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_amount -= lst_amount;

    emit!(crate::events::GetLstFromStratEvent {
        main_state: ctx.accounts.main_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        vault_strategy_relation_entry: ctx.accounts.vault_strategy_relation_entry.key(),
        desired_amount,
        existent_amount,
        lst_amount,
    });

    Ok(())
}
