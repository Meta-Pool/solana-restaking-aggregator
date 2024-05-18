pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod util;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("MVPpyLcH42bRtLXUWFnozcycqZ1WByvjDthCAgHh1fM");

#[program]
pub mod mp_sol_restaking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, operator_auth:Pubkey, strategy_rebalancer_auth:Pubkey) -> Result<()> {
        initialize::handle_initialize(ctx, operator_auth, strategy_rebalancer_auth)
    }

    pub fn create_secondary_vault(ctx: Context<CreateSecondaryVault>) -> Result<()> {
        create_secondary_vault::handle_create_secondary_vault(ctx)
    }
}
