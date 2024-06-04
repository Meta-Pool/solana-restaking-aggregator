// use crate::error::ErrorCode;
// use anchor_lang::prelude::*;
// use anchor_lang::{require_gte, solana_program::clock::Clock};

pub const TWO_POW_32: u64 = 0x1_0000_0000; // 32-bit price precision, to store a LST/SOL price in u64

pub const BASIS_POINTS_100_PERCENT: u16 = 10_000;

pub fn mul_div(amount: u64, numerator: u64, denominator: u64) -> u64 {
    u64::try_from((amount as u128) * (numerator as u128) / (denominator as u128)).unwrap()
}

/// convert a sol-value into a mpsol-amount,
/// considering mpSOL current price = backing-sol-value / mpsol-supply
/// mpsol_amount = sol-value / ( backing-sol-value / mpsol-supply )
/// mpsol_amount = sol-value * mpsol-supply / backing-sol-value
/// if you deposit sol-value and mint mpsol-amount, then the mpSOL price does not change
pub fn sol_value_to_mpsol_amount(
    sol_value: u64,
    main_vault_backing_sol_value: u64,
    mpsol_current_supply: u64,
) -> u64 {
    if mpsol_current_supply == 0 {
        sol_value
    } else {
        mul_div(
            sol_value,
            mpsol_current_supply,
            main_vault_backing_sol_value
        )
    }
}

/// convert mpsol-amount into a sol-value,
/// considering mpSOL current price = backing-sol-value / mpsol-supply
/// sol-value = mpsol_amount * ( backing-sol-value / mpsol-supply )
/// if you remove sol-value from backing-sol-value and burn mpsol-amount, then the mpSOL price does not change
pub fn mpsol_amount_to_sol_value(
    mpsol_amount: u64,
    mpsol_backing_sol_value: u64,
    mpsol_current_supply: u64,
) -> u64 {
    mul_div(mpsol_amount, mpsol_backing_sol_value, mpsol_current_supply)
}

/// convert a lst-token-amount into a sol-value, using a 32-bit precision price
/// considering token_sol_price_p32 is LST/SOL in an u64 with 32-bit precision
/// sol-value = token-amount * token-sol-price
pub fn lst_amount_to_sol_value(lst_amount: u64, lst_sol_price_p32: u64) -> u64 {
    mul_div(lst_amount, lst_sol_price_p32, TWO_POW_32)
}

/// convert a sol-value in a lst-token-amount, using a 32-bit precision price
/// considering token_sol_price_p32 is LST/SOL in an u64 with 32-bit precision
/// token-amount = sol-value / token-sol-price
pub fn sol_value_to_lst_amount(sol_value: u64, lst_sol_price_p32: u64) -> u64 {
    mul_div(sol_value, TWO_POW_32, lst_sol_price_p32)
}
// apply basis points to an amount
pub fn apply_bp(amount: u64, bp: u16) -> u64 {
    mul_div(amount, bp as u64, BASIS_POINTS_100_PERCENT as u64)
}
