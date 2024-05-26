use anchor_lang::prelude::*;

#[constant]
pub const AUTH_SEED: &[u8] = b"-auth-";
#[constant]
pub const MIN_MOVEMENT_LAMPORTS: u64 = 1_000_000; // avoid low-amount/rounding attacks
