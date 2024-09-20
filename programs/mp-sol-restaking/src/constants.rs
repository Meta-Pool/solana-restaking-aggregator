use anchor_lang::prelude::*;

#[constant]
pub const MAX_WHITELISTED_VAULTS: u8 = 64;
#[constant]
pub const MAX_WHITELISTED_VAULT_STRATEGIES: u8 = 64;
#[constant]
pub const MAIN_VAULT_MINT_AUTH_SEED: &'static [u8] = b"main-mint";
#[constant]
pub const VAULTS_ATA_AUTH_SEED: &'static [u8] = b"vaults-ata-auth";
#[constant]
pub const VAULT_STRAT_WITHDRAW_ATA_AUTH_SEED: &'static [u8] = b"lst_withdraw_authority";
#[constant]
pub const MIN_MOVEMENT_LAMPORTS: u64 = 1_000_000; // avoid low-amount/rounding attacks
#[constant]
pub const MAX_PERFORMANCE_FEE_BP: u16 = 2500; // max 25% performance fee
#[constant]
pub const MAX_WITHDRAW_FEE_BP: u16 = 100; // max 1% withdraw fee
#[constant]
pub const VAULT_STRAT_ENTRY_SEED: &'static [u8] = b"vault-strat-entry";

// generic word-seed for b"authority" --- used by strategies
#[constant]
pub const AUTHORITY_SEED: &'static [u8] = b"authority";
