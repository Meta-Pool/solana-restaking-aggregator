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

    // ------------------
    // admin
    // ------------------
    pub fn initialize(
        ctx: Context<Initialize>,
        operator_auth: Pubkey,
        strategy_rebalancer_auth: Pubkey,
    ) -> Result<()> {
        initialize::handle_initialize(ctx, operator_auth, strategy_rebalancer_auth)
    }

    pub fn create_secondary_vault(ctx: Context<CreateSecondaryVault>) -> Result<()> {
        create_secondary_vault::handle_create_secondary_vault(ctx)
    }

    pub fn update_vault_token_sol_price(ctx: Context<UpdateVaultTokenSolPrice>) -> Result<()> {
        update_vault_token_sol_price::handle_update_vault_token_sol_price(ctx)
    }

    pub fn configure_secondary_vault(
        ctx: Context<ConfigureSecondaryVault>,
        values: ConfigureSecondaryVaultValues,
    ) -> Result<()> {
        configure_secondary_vault::handle_configure_secondary_vault(ctx, values)
    }

    // ------------------
    // users
    // ------------------
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        users::stake::handle_stake(ctx, amount)
    }
}
