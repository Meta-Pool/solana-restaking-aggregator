use crate::error::ErrorCode;
use anchor_lang::prelude::*;
use anchor_lang::{require_gte, solana_program::clock::Clock};

pub const ONE_BILLION: u64 = 1_000_000_000; // price precision

pub const ONE_DAY_IN_SECONDS: u64 = 60 * 60 * 24;

pub const BASIS_POINTS_100_PERCENT: u16 = 10_000;

pub fn mul_div(amount: u64, numerator: u64, denominator: u64) -> u64 {
    u64::try_from((amount as u128) * (numerator as u128) / (denominator as u128)).unwrap()
}

pub fn sol_value_to_token_amount(sol_value: u64, token_sol_price: u64) -> u64 {
    mul_div(sol_value, ONE_BILLION, token_sol_price)
}
pub fn token_to_sol_value(token_amount: u64, token_sol_price: u64) -> u64 {
    mul_div(token_amount, token_sol_price, ONE_BILLION)
}

// apply basis points calculation
pub fn apply_bp(amount: u64, bp: u16) -> u64 {
    mul_div(amount, bp as u64, BASIS_POINTS_100_PERCENT as u64)
}

pub fn check_price_not_stale_seconds(
    token_sol_price_timestamp: u64,
    max_seconds_allowed: u64,
) -> Result<()> {
    let now_ts = Clock::get().unwrap().unix_timestamp as u64;
    let elapsed_seconds = now_ts - token_sol_price_timestamp;
    require_gte!(
        max_seconds_allowed,
        elapsed_seconds,
        ErrorCode::TokenSolPriceIsStale
    );
    Ok(())
}

pub fn check_price_not_stale(token_sol_price_timestamp: u64) -> Result<()> {
    check_price_not_stale_seconds(token_sol_price_timestamp, ONE_DAY_IN_SECONDS)
}
