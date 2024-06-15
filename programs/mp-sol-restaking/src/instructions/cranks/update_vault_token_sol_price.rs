use crate::state::external::marinade_pool_state::{
    MarinadeState, MARINADE_MSOL_MINT, MARINADE_STATE_ADDRESS,
};
use crate::state::external::spl_stake_pool_state::{
    AccountType, SplStakePoolState, SPL_STAKE_POOL_PROGRAM,
};
use crate::state::MainVaultState;
use crate::{error::ErrorCode, SecondaryVaultState};
use anchor_lang::prelude::*;
use shared_lib::{lst_amount_to_sol_value, mul_div, TWO_POW_32};

use ::borsh::BorshDeserialize;
use anchor_lang::solana_program::{pubkey, pubkey::Pubkey};

#[derive(Accounts)]
// permissionless
pub struct UpdateVaultTokenSolPrice<'info> {
    #[account(mut)]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: No auto-deserialization
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

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

pub const WSOL_MINT: Pubkey = pubkey!("So11111111111111111111111111111111111111112");

pub fn handle_update_vault_token_sol_price(ctx:  Context<UpdateVaultTokenSolPrice>) -> Result<()> {
    
    // obtain lst-state account info if required
    let lst_state = match ctx.accounts.lst_mint.key() {
        // wSol is simple, always 1 - no state required
        WSOL_MINT => None,
        _ => {
            // assume the corresponding marinade state account sent in remaining_accounts
            require_eq!(ctx.remaining_accounts.len(), 1, ErrorCode::MissingLstStateInRemainingAccounts);
            Some(ctx.remaining_accounts[0].to_account_info())
        }
    };

    internal_update_vault_token_sol_price(
        &mut ctx.accounts.main_state,
        &mut ctx.accounts.secondary_state,
        lst_state,
    )
}

pub fn internal_update_vault_token_sol_price(
    main_state: &mut Account<MainVaultState>,
    secondary_state: &mut Account<SecondaryVaultState>,
    lst_state: Option<AccountInfo>
) -> Result<()> {
    //
    let old_price_p32 = secondary_state.lst_sol_price_p32;

    let new_price_p32 = match secondary_state.lst_mint.key() {
        // wSol is simple, always 1
        WSOL_MINT => TWO_POW_32,

        // mSol, read marinade state
        MARINADE_MSOL_MINT => {
            let lst_state = lst_state.expect("must provide marinade state at remaining_accounts[0]");
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
            // verify owner program & data_len
            let lst_state = lst_state.expect("must provide spl-stake-pool state at remaining_accounts[0]");
            require_keys_eq!(
                *lst_state.owner,
                SPL_STAKE_POOL_PROGRAM,
                ErrorCode::SplStakePoolStateAccountOwnerIsNotTheSplStakePoolProgram
            );
            // try deserialize
            let mut data_slice = &lst_state.data.borrow()[..];
            let spl_stake_pool_state: SplStakePoolState =
                SplStakePoolState::deserialize(&mut data_slice)?;
            // debug log show data
            // msg!("stake_pool={:?}", spl_stake_pool_state);
            // verify mint
            require_keys_eq!(
                spl_stake_pool_state.pool_mint,
                secondary_state.lst_mint.key()
            );
            // verify type
            require!(
                spl_stake_pool_state.account_type == AccountType::StakePool,
                ErrorCode::AccountTypeIsNotStakePool
            );
            // compute true price = total_lamports / pool_token_supply
            // with 32-bit precision
            mul_div(
                spl_stake_pool_state.total_lamports,
                TWO_POW_32,
                spl_stake_pool_state.pool_token_supply,
            )
        }
    };

    // only if price changed
    if new_price_p32 != old_price_p32 {
        //
        // Phase 1. Collect values
        let lst_amount = secondary_state.vault_total_lst_amount;
        let old_sol_value = lst_amount_to_sol_value(lst_amount, old_price_p32);
        let new_sol_value = lst_amount_to_sol_value(lst_amount, new_price_p32);
        let (profit, slashing) = {
            // Phase 2. ?
            if new_sol_value >= old_sol_value {
                // Phase 3. Profit!
                (new_sol_value - old_sol_value, 0)
            } else {
                // slashed? :(
                (0, old_sol_value - new_sol_value)
            }
        };

        // update main_state.backing_sol_value with delta sol-value
        main_state.backing_sol_value = main_state.backing_sol_value + profit - slashing;

        // update last price and timestamp
        secondary_state.lst_sol_price_p32 = new_price_p32;
        secondary_state.lst_sol_price_timestamp = Clock::get().unwrap().unix_timestamp as u64;

        emit!(crate::events::UpdateVaultTokenSolPriceEvent {
            main_state: main_state.key(),
            lst_mint: secondary_state.lst_mint.key(),
            lst_amount,
            old_price_p32,
            old_sol_value,
            new_price_p32,
            new_sol_value,
            main_vault_backing_sol_value: main_state.backing_sol_value,
        });
    }
    Ok(())
}
