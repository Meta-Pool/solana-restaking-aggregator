use crate::{error::ErrorCode, state::MainVaultState, MAX_PERFORMANCE_FEE_BP, MAX_WITHDRAW_FEE_BP};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigureMainVaultValues {
    unstake_ticket_waiting_hours: Option<u16>,
    withdraw_fee_bp: Option<u16>,
    performance_fee_bp: Option<u16>,
    new_admin_pubkey: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct ConfigureMainVault<'info> {
    #[account()]
    pub admin: Signer<'info>,

    #[account(mut, has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,
}

pub fn handle_configure_main_vault(
    ctx: Context<ConfigureMainVault>,
    values: ConfigureMainVaultValues,
) -> Result<()> {
    if let Some(unstake_ticket_waiting_hours) = values.unstake_ticket_waiting_hours {
        ctx.accounts.main_state.unstake_ticket_waiting_hours = unstake_ticket_waiting_hours;
    }
    if let Some(withdraw_fee_bp) = values.withdraw_fee_bp {
        require_gte!(
            MAX_WITHDRAW_FEE_BP,
            withdraw_fee_bp,
            ErrorCode::WithdrawFeeTooHigh
        );
        ctx.accounts.main_state.withdraw_fee_bp = withdraw_fee_bp;
    }
    if let Some(performance_fee_bp) = values.performance_fee_bp {
        require_gte!(
            MAX_PERFORMANCE_FEE_BP,
            performance_fee_bp,
            ErrorCode::PerformanceFeeTooHigh
        );
        ctx.accounts.main_state.performance_fee_bp = performance_fee_bp;
    }
    if let Some(new_admin_pubkey) = values.new_admin_pubkey {
        ctx.accounts.main_state.admin = new_admin_pubkey;
    }
    Ok(())
}

#[derive(Accounts)]
pub struct ConfigureTreasuryAccount<'info> {
    #[account()]
    pub admin: Signer<'info>,

    #[account(mut, has_one = admin, has_one = mpsol_mint)]
    pub main_state: Account<'info, MainVaultState>,

    #[account()]
    pub mpsol_mint: Box<Account<'info, Mint>>,

    #[account(token::mint = mpsol_mint)]
    pub treasury_mpsol_account: Account<'info, TokenAccount>,
}

pub fn handle_configure_treasury_account(ctx: Context<ConfigureTreasuryAccount>) -> Result<()> {
    ctx.accounts.main_state.treasury_mpsol_account =
        Some(ctx.accounts.treasury_mpsol_account.key());
    Ok(())
}
