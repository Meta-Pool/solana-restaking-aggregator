use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod events;

pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use events::*;

declare_id!("GSEnbRPqfKCkhMLfd4HjPxdNPYkQPgQe2tbHtrgAdayC");

#[program]
pub mod generic_strategy_example {
    use super::*;

    // ------------------
    // admin
    // ------------------
    pub fn initialize(
        ctx: Context<Initialize>,
    ) -> Result<()> {
        initialize::handle_initialize(ctx)
    }

    // ------------------
    // cranks
    // ------------------
    pub fn update_lst_amount(
        ctx: Context<UpdateLstAmount>,
    ) -> Result<()> {
        update_lst_amount::handle_update_lst_amount(ctx)
    }
    
}
