use crate::{state::MainVaultState, MAX_PERFORMANCE_FEE_BP, error::ErrorCode};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigureMainVaultValues {
    unstake_ticket_waiting_hours: Option<u16>,
    performance_fee_bp: Option<u16>,
    treasury_mpsol_account: Option<Pubkey>,
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
    if let Some(treasury_mpsol_account) = values.treasury_mpsol_account {
        ctx.accounts.main_state.treasury_mpsol_account = Some(treasury_mpsol_account);
    }
    if let Some(performance_fee_bp) = values.performance_fee_bp {
        require_gte!(MAX_PERFORMANCE_FEE_BP, performance_fee_bp, ErrorCode::PerformanceFeeTooHigh); 
        ctx.accounts.main_state.performance_fee_bp = performance_fee_bp;
    }
    if let Some(new_admin_pubkey) = values.new_admin_pubkey {
        ctx.accounts.main_state.admin = new_admin_pubkey;
    }
    Ok(())
}
