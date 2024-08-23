use crate::error::ErrorCode;
use crate::state::MainVaultState;
use crate::{constants::*, SecondaryVaultState, VaultStrategyRelationEntry};
use anchor_lang::prelude::*;

use anchor_spl::token::{Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct TransferLstToStrat<'info> {
    #[account(has_one = operator_auth)]
    pub main_state: Account<'info, MainVaultState>,

    // the one in main_state
    #[account()]
    pub operator_auth: Signer<'info>, 

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

    #[account(mut,
        associated_token::mint = lst_mint, 
        associated_token::authority = vaults_ata_pda_auth
    )]
    pub vault_lst_account: Account<'info, TokenAccount>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the system
    #[account(
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

    /// CHECK: strategy program code
    #[account()]
    pub strategy_program_code: UncheckedAccount<'info>,
    
    /// must be the one mentioned in vault_strategy_relation_entry
    /// CHECK: external acc manually deserialized
    #[account( owner=strategy_program_code.key() )]
    pub common_strategy_state: UncheckedAccount<'info>,

    /// CHECK: PDA strat authority, used to compute ATA
    #[account(
        seeds = [
            AUTHORITY_SEED,
            common_strategy_state.key().as_ref()
        ],
        bump,
        seeds::program = strategy_program_code.key()
    )]
    strategy_authority: UncheckedAccount<'info>,

    #[account(mut,
        associated_token::mint = lst_mint,
        associated_token::authority = strategy_authority,
    )]
    strategy_deposit_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_transfer_lst_to_strat(ctx: Context<TransferLstToStrat>, lst_amount: u64) -> Result<()> {

    require_gt!(lst_amount,0, ErrorCode::AmountIsZero);

    // Transfer tokens from vault to strat lst
    {
        let transfer_instruction = Transfer {
            from: ctx.accounts.vault_lst_account.to_account_info(),
            to: ctx.accounts.strategy_deposit_account.to_account_info(),
            authority: ctx.accounts.vaults_ata_pda_auth.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        anchor_spl::token::transfer(cpi_ctx, lst_amount)?;
    }
    // now in strategies
    ctx.accounts.vault_state.in_strategies_amount += lst_amount;
    // no longer locally stored amount
    ctx.accounts.vault_state.locally_stored_amount -= lst_amount;

    emit!(crate::events::TransferLstToStratEvent {
        main_state: ctx.accounts.main_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        vault_strategy_relation_entry: ctx.accounts.vault_strategy_relation_entry.key(),
        lst_amount,
    });

    Ok(())
}
