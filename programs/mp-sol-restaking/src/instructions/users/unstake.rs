use crate::{constants::*, error::ErrorCode, MainVaultState, UnstakeTicket};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::{burn, Burn, Mint, Token, TokenAccount};
use shared_lib::mpsol_amount_to_sol_value;

#[derive(Accounts)]
/// Unstake: burn mpSOL and get an unstake-ticket for the SOL-value of the mpSOL burned
/// This instruction creates an Unstake-ticket with a SOL-value, that when due, 
/// can be exchanged for any of the available LST tokens, for the specified SOL-value
pub struct Unstake<'info> {
    #[account(mut, has_one = mpsol_mint)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mut)]
    pub unstaker: Signer<'info>,
    #[account(mut, token::mint = mpsol_mint, token::authority = unstaker)]
    pub unstaker_mpsol_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mpsol_mint: Box<Account<'info, Mint>>,

    #[account(init, payer = unstaker, space = 8 + UnstakeTicket::INIT_SPACE)]
    pub new_ticket_account: Account<'info, UnstakeTicket>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_unstake(ctx: Context<Unstake>, mpsol_amount: u64) -> Result<()> {

    // compute the sol value of the mpsol to burn
    let ticket_sol_value = mpsol_amount_to_sol_value(
        mpsol_amount,
        ctx.accounts.main_state.backing_sol_value,
        ctx.accounts.mpsol_mint.supply,
    );

    // check sol_amount > MIN_MOVEMENT_LAMPORTS
    require_gte!(
        ticket_sol_value,
        MIN_MOVEMENT_LAMPORTS,
        ErrorCode::UnstakeAmountTooSmall
    );

    // -------
    // burn the mpSOL and keep contract internal accounting
    // -------
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mpsol_mint.to_account_info(),
                from: ctx.accounts.unstaker_mpsol_account.to_account_info(),
                authority: ctx.accounts.unstaker.to_account_info(),
            },
        ),
        mpsol_amount,
    )?;
    // by removing from main_state.backing_sol_value,
    // mpSOL price remains the same after the burn 
    ctx.accounts.main_state.backing_sol_value -= ticket_sol_value;
    // -------

    // compute ticket due timestamp
    let now_ts = Clock::get().unwrap().unix_timestamp as u64;
    let ticket_due_timestamp =
        now_ts + ( ctx.accounts.main_state.unstake_ticket_waiting_hours as u64 * 60 * 60 );

    // initialize new_ticket_account
    ctx.accounts
        .new_ticket_account
        .set_inner(crate::state::UnstakeTicket {
            main_state: ctx.accounts.main_state.key(),
            beneficiary: ctx.accounts.unstaker.key(),
            ticket_sol_value,
            ticket_due_timestamp,
        });

    // -------
    // keep outstanding unstake tickets global accounting
    // this will make the bot remove sol-value from strategies before the ticket is due
    // -------
    ctx.accounts.main_state.outstanding_tickets_sol_value += ticket_sol_value;

    emit!(crate::events::UnstakeEvent {
        main_state: ctx.accounts.main_state.key(),
        unstaker: ctx.accounts.unstaker.key(),
        mpsol_amount: mpsol_amount,
        ticket_account: ctx.accounts.new_ticket_account.key(),
        ticket_sol_value,
        unstaker_mpsol_account: ctx.accounts.unstaker_mpsol_account.key(),
        mpsol_burned: mpsol_amount,
        ticket_due_timestamp,
        //--- mpSOL price components after the unstake
        main_vault_backing_sol_value: ctx.accounts.main_state.backing_sol_value,
        mpsol_supply: ctx.accounts.mpsol_mint.supply - mpsol_amount,
    });

    Ok(())
}
