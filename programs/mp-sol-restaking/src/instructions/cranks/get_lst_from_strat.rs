use crate::error::ErrorCode;
use crate::state::MainVaultState;
use crate::{constants::*, SecondaryVaultState, VaultStrategyRelationEntry};
use anchor_lang::prelude::*;

use anchor_spl::token::{TokenAccount, Transfer, Token};

#[derive(Accounts)]
pub struct GetLstFromStrat<'info> {
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

    #[account( 
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
            &common_strategy_state.key().to_bytes(),
            crate::VAULT_STRAT_WITHDRAW_ATA_AUTH_SEED
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

    let lst_amount = ctx.accounts.vault_strategy_relation_entry.next_withdraw_lst_amount;
    require_gt!(lst_amount,0, ErrorCode::AmountIsZero);

    // Transfer tokens from strat deposited temp lst account to vault account
    {
        let transfer_instruction = Transfer {
            from: ctx.accounts.lst_withdraw_account.to_account_info(),
            to: ctx.accounts.vault_lst_account.to_account_info(),
            authority: ctx.accounts.vault_strat_withdraw_auth.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        anchor_spl::token::transfer(cpi_ctx, lst_amount)?;
    }
    // compute as locally stored amount
    ctx.accounts.vault_state.locally_stored_amount += lst_amount;
    // no longer in strategies
    ctx.accounts.vault_state.in_strategies_amount -= lst_amount;

    // reset field next_withdraw_lst_amount
    ctx.accounts.vault_strategy_relation_entry.next_withdraw_lst_amount = 0;
    
    Ok(())
}
