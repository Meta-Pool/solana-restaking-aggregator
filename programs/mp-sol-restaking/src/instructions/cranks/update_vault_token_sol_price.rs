use crate::state::external::marinade_pool_state::{MarinadeState, MARINADE_MSOL_MINT, MARINADE_STATE_ADDRESS};
use crate::state::external::spl_stake_pool_state::{
    AccountType, SplStakePoolState, SPL_STAKE_POOL_PROGRAM,
};
use crate::state::MainVaultState;
use crate::util::TWO_POW_32;
use crate::{constants::*, error::ErrorCode, SecondaryVaultState};
use anchor_lang::prelude::*;

use ::borsh::BorshDeserialize;
use anchor_lang::solana_program::{pubkey, pubkey::Pubkey};
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct UpdateVaultTokenSolPrice<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account(mut,
        has_one = token_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &token_mint.key().to_bytes(),
        ],
        bump
    )]
    pub secondary_state: Account<'info, SecondaryVaultState>,

    #[account(mint::decimals = 9)]
    // all mints must have 9 decimals, to simplify x/SOL price calculations
    pub token_mint: Account<'info, Mint>,

    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            VAULTS_ATA_AUTH_SEED
        ],
        bump
    )]
    pub vaults_ata_pda_auth: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub const WSOL_MINT: Pubkey = pubkey!("So11111111111111111111111111111111111111112");

pub fn handle_update_vault_token_sol_price(ctx: Context<UpdateVaultTokenSolPrice>) -> Result<()> {
    ctx.accounts.secondary_state.token_sol_price_timestamp =
        Clock::get().unwrap().unix_timestamp as u64;
    ctx.accounts.secondary_state.lst_sol_price_p32 = match ctx.accounts.token_mint.key() {
        // wSol is simple, always 1
        WSOL_MINT => TWO_POW_32,

        // mSol, read marinade state
        MARINADE_MSOL_MINT => {
            // assume the corresponding marinade state account sent in remaining_accounts
            require_eq!(ctx.remaining_accounts.len(), 1);
            let lst_state = &ctx.remaining_accounts[0];
            // msg!(lst_state.key.to_string().as_str());
            // marinade state address is known, verify
            require_keys_eq!(
                *lst_state.key,
                MARINADE_STATE_ADDRESS,
                ErrorCode::IncorrectMarinadeStateAddress
            );
            // try deserialize
            let mut data_slice = &lst_state.data.borrow()[..];
            let marinade_state: MarinadeState = MarinadeState::deserialize(&mut data_slice)?;
            // compute true price = total_lamports / pool_token_supply
            // https://docs.marinade.finance/marinade-protocol/system-overview/msol-token#msol-price
            // marinade already uses 32-bit precision price
            marinade_state.msol_price
        }
        // TODO: Inf/Sanctum
        ,
        _ => {
            // none of the above, try a generic SPL-stake-pool
            // assume the corresponding SPL-stake-pool state account sent in remaining_accounts[0]
            require_eq!(ctx.remaining_accounts.len(), 1);
            // msg!(lst_state.key.to_string().as_str());
            let lst_state = &ctx.remaining_accounts[0];
            // verify owner program & data_len
            require_keys_eq!(
                *lst_state.owner,
                SPL_STAKE_POOL_PROGRAM,
                ErrorCode::SplStakePoolStateAccountOwnerIsNotTheSplStakePoolProgram
            );
            require_eq!(lst_state.data_len(), 611);
            // try deserialize
            let mut data_slice = &lst_state.data.borrow()[..];
            let spl_stake_pool_state: SplStakePoolState =
                SplStakePoolState::deserialize(&mut data_slice)?;
            // debug log show data
            // msg!("stake_pool={:?}", spl_stake_pool_state);
            // verify mint
            require_keys_eq!(
                spl_stake_pool_state.pool_mint,
                ctx.accounts.token_mint.key()
            );
            // verify type
            require!(
                spl_stake_pool_state.account_type == AccountType::StakePool,
                ErrorCode::AccountTypeIsNotStakePool
            );
            // compute true price = total_lamports / pool_token_supply
            // with 32-bit precision
            crate::util::mul_div(
                spl_stake_pool_state.total_lamports,
                TWO_POW_32,
                spl_stake_pool_state.pool_token_supply
            )
        }
    };
    Ok(())
}
