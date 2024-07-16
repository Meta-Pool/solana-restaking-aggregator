use crate::state::MainVaultState;
use crate::SecondaryVaultState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
// permissionless
pub struct UpdateVaultTicketTarget<'info> {
    #[account(mut, has_one = operator_auth)]
    pub main_state: Account<'info, MainVaultState>,

    // the one in main_state
    #[account()]
    pub operator_auth: Signer<'info>, 

    /// CHECK: No auto-deserialization
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    // PDA computed from main_state & lst_mint 
    #[account(mut,
        has_one = lst_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    pub secondary_state: Account<'info, SecondaryVaultState>,

}

pub fn handle_update_vault_ticket_target(
    ctx: Context<UpdateVaultTicketTarget>,
    new_ticket_target_sol_amount: u64,
) -> Result<()> {
    ctx.accounts.secondary_state.tickets_target_sol_amount = new_ticket_target_sol_amount;
    Ok(())
}
