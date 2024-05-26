use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use crate::util::sol_value_to_lst_amount;
use crate::{internal_update_vault_token_sol_price, SecondaryVaultState};
use crate::{constants::*, error::ErrorCode, MainVaultState, UnstakeTicket};
use anchor_spl::token::{Token, TokenAccount, Transfer};

#[derive(Accounts)]
/// Claim-ticket: total o partial claim of the SOL-value of an unstake-ticket
/// This instruction allows the ticket-beneficiary to withdraw 
/// any of the available LST tokens, up to the specified SOL-value of the ticket
/// If all the sol-value is withdrawn, the ticket is closed
pub struct TicketClaim<'info> {
    #[account(mut)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(mut, has_one = beneficiary)]
    pub ticket_account: Account<'info, UnstakeTicket>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    #[account(mut, token::mint = lst_mint, token::authority = beneficiary)]
    pub beneficiary_lst_account: Account<'info, TokenAccount>,

    // secondary vaults are PDAs of main_state
    // only this program & main_state can create a secondary vault
    #[account(
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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_ticket_claim(ctx: Context<TicketClaim>, withdraw_sol_value_amount: u64) -> Result<()> {

    // check ticket is due
    let now_ts = Clock::get().unwrap().unix_timestamp as u64;
    require_gte!(
        now_ts,
        ctx.accounts.ticket_account.ticket_due_timestamp,
        ErrorCode::TicketIsNotDueYet
    );

    let ticket_sol_value = ctx.accounts.ticket_account.ticket_sol_value;

    // check enough sol_value in ticket
    require_gte!(
        ticket_sol_value,
        withdraw_sol_value_amount,
        ErrorCode::NotEnoughSolValueInTicket
    );

    // check mpsol_amount > MIN_MOVEMENT_LAMPORTS
    if withdraw_sol_value_amount < ticket_sol_value {
        require_gte!(
            withdraw_sol_value_amount,
            MIN_MOVEMENT_LAMPORTS,
            ErrorCode::UnstakeAmountToSmall
        );
    }

    // -------
    // keep outstanding unstake tickets global accounting
    // this will make the bot remove sol-value from strategies before the ticket is due
    // -------
    ctx.accounts.main_state.outstanding_tickets_sol_value -= withdraw_sol_value_amount;
    // update current ticket_sol_value
    ctx.accounts.ticket_account.ticket_sol_value -= withdraw_sol_value_amount;

    if ctx.accounts.ticket_account.ticket_sol_value == 0 {
        // close ticket, 
        // mark ticket-account for deletion by moving all raw.account-storage lamports to beneficiary.
        // at this point ctx.accounts.ticket_account.ticket_sol_value = 0, and this works as a tombstone
        let ticket_account_info = ctx.accounts.ticket_account.to_account_info();
        let mut ticket_account_lamports = ticket_account_info.lamports.borrow_mut();
        let beneficiary_account_info = ctx.accounts.beneficiary.to_account_info();
        let mut beneficiary_lamports = beneficiary_account_info.lamports.borrow_mut();
        **beneficiary_lamports += **ticket_account_lamports;
        **ticket_account_lamports = 0;
    }

    // sol value should be <= tickets_target_sol_amount
    require_gte!(
        ctx.accounts.vault_state.tickets_target_sol_amount,
        withdraw_sol_value_amount,
        ErrorCode::VaultTicketTargetIsLowerThanSolValueToWithdraw
    );
    // if removed, we can lower the tickets_target_sol_amount
    ctx.accounts.vault_state.tickets_target_sol_amount -= withdraw_sol_value_amount;
    // also it is no longer outstanding
    ctx.accounts.main_state.outstanding_tickets_sol_value -= withdraw_sol_value_amount;

    // we need the LST/SOL price to be updated
    // update LST/SOL price now
    internal_update_vault_token_sol_price(
        &mut ctx.accounts.main_state, 
        &mut ctx.accounts.vault_state, 
        if ctx.remaining_accounts.len() >= 1 {Some(ctx.remaining_accounts[0].to_account_info())} else {None})?;

    // compute how much lst is required to honor withdraw_sol_value_amount
    let lst_amount_to_deliver =
        sol_value_to_lst_amount(withdraw_sol_value_amount, ctx.accounts.vault_state.lst_sol_price_p32);
    // check enough lst in vault
    require_gte!(
        ctx.accounts.vault_lst_account.amount,
        lst_amount_to_deliver,
        ErrorCode::NotEnoughLstInVault
    );
    // send tokens to the user
    {
        let transfer_instruction = Transfer {
            from: ctx.accounts.vault_lst_account.to_account_info(),
            to: ctx.accounts.beneficiary_lst_account.to_account_info(),
            authority: ctx.accounts.vaults_ata_pda_auth.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        anchor_spl::token::transfer(cpi_ctx, lst_amount_to_deliver)?;
    }
    // the tokens are removed from the vault total
    ctx.accounts.vault_state.vault_total_lst_amount -= lst_amount_to_deliver;
    // and computed as locally stored amount
    ctx.accounts.vault_state.locally_stored_amount -= lst_amount_to_deliver;

    emit!(crate::events::TicketClaimEvent {
        main_state: ctx.accounts.main_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        ticket_account: ctx.accounts.ticket_account.key(),
        beneficiary: ctx.accounts.beneficiary.key(),
        claimed_sol_value: withdraw_sol_value_amount,
        ticket_sol_value_remaining: ctx.accounts.ticket_account.ticket_sol_value,
        lst_amount_delivered: lst_amount_to_deliver,
        ticket_due_timestamp: ctx.accounts.ticket_account.ticket_due_timestamp,
    });

    Ok(())
}
