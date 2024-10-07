use crate::{error::ErrorCode, state::MainVaultState, MAX_PERFORMANCE_FEE_BP, MAX_WITHDRAW_FEE_BP};
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct ConfigureTreasuryAccount<'info> {
    #[account()]
    pub admin: Signer<'info>,

    #[account(mut, has_one = admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(token::mint = main_state.mpsol_mint)]
    pub treasury_mpsol_account: Account<'info, TokenAccount>,
}
pub fn handle_configure_treasury_account(ctx: Context<ConfigureTreasuryAccount>) -> Result<()> {
    ctx.accounts.main_state.treasury_mpsol_account =
        Some(ctx.accounts.treasury_mpsol_account.key());
    Ok(())
}

// common accounts for multiple config instructions
#[derive(Accounts)]
pub struct AdminAndMainStateAccounts<'info> {
    #[account()]
    pub admin: Signer<'info>,

    #[account(mut, has_one = admin)]
    pub main_state: Account<'info, MainVaultState>,
}
pub fn handle_clear_treasury_account(ctx: Context<AdminAndMainStateAccounts>) -> Result<()> {
    ctx.accounts.main_state.treasury_mpsol_account = None;
    Ok(())
}
pub fn handle_configure_unstake_waiting_hours(
    ctx: Context<AdminAndMainStateAccounts>,
    hours: u16,
) -> Result<()> {
    ctx.accounts.main_state.unstake_ticket_waiting_hours = hours;
    Ok(())
}
pub fn handle_configure_withdrawal_fee(
    ctx: Context<AdminAndMainStateAccounts>,
    bp: u16,
) -> Result<()> {
    require_gte!(MAX_WITHDRAW_FEE_BP, bp, ErrorCode::WithdrawFeeTooHigh);
    ctx.accounts.main_state.withdraw_fee_bp = bp;
    Ok(())
}
pub fn handle_configure_performance_fee(
    ctx: Context<AdminAndMainStateAccounts>,
    bp: u16,
) -> Result<()> {
    require_gte!(MAX_PERFORMANCE_FEE_BP, bp, ErrorCode::PerformanceFeeTooHigh);
    ctx.accounts.main_state.performance_fee_bp = bp;
    Ok(())
}
pub fn handle_configure_operator_auth(
    ctx: Context<AdminAndMainStateAccounts>,
    auth: Pubkey,
) -> Result<()> {
    ctx.accounts.main_state.operator_auth = auth;
    Ok(())
}
pub fn handle_configure_new_admin(
    ctx: Context<AdminAndMainStateAccounts>,
    new_admin: Pubkey,
) -> Result<()> {
    ctx.accounts.main_state.admin = new_admin;
    Ok(())
}
