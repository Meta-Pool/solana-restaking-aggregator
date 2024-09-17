use crate::state::MainVaultState;
use crate::SecondaryVaultState;
use anchor_lang::prelude::*;

use anchor_spl::token::Mint;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ConfigureSecondaryVaultValues {
    deposits_disabled: Option<bool>,
    token_deposit_cap: Option<u64>,
}

#[derive(Accounts)]
pub struct ConfigureSecondaryVault<'info> {
    #[account()]
    pub admin: Signer<'info>,

    #[account(has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account()]
    // all mints must have 9 decimals, to simplify x/SOL price calculations
    pub lst_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    pub secondary_state: Account<'info, SecondaryVaultState>,
}

pub fn handle_configure_secondary_vault(
    ctx: Context<ConfigureSecondaryVault>,
    values: ConfigureSecondaryVaultValues,
) -> Result<()> {
    if let Some(deposits_disabled) = values.deposits_disabled {
        ctx.accounts.secondary_state.deposits_disabled = deposits_disabled
    }
    if let Some(token_deposit_cap) = values.token_deposit_cap {
        ctx.accounts.secondary_state.token_deposit_cap = token_deposit_cap
    }

    Ok(())
}
