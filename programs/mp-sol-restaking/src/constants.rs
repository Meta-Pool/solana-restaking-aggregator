use anchor_lang::prelude::*;

#[constant]
pub const MAX_WHITELISTED_VAULT_PROGRAMS: u8 = 16;
#[constant]
pub const MAX_WHITELISTED_VAULTS: u8 = 64;
#[constant]
pub const MAIN_VAULT_MINT_AUTH_SEED: &[u8] = b"main-mint-auth";
#[constant]
pub const MIN_DEPOSIT_UNITS: u64 = 1_000_000; // avoid low-amount/rounding attacks
