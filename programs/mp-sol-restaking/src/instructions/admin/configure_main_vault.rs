use crate::state::MainVaultState;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigureMainVaultValues {
    unstake_ticket_waiting_hours: Option<u16>,
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
    Ok(())
}
