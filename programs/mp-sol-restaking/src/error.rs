use anchor_lang::prelude::*;

// NOTE: Anchor adds 6000 to user error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid vault index ")]
    InvalidVaultIndex, // 6000 0x1770

    #[msg("token_sol_price is stale")]
    TokenSolPriceIsStale, // 6001 0x1771

    #[msg("Deposit amount too small")]
    DepositAmountToSmall, 

    #[msg("Withdraw amount too small")]
    WithdrawAmountTooSmall, 

    #[msg("not enough tokens in the vault")]
    NotEnoughTokensInTheVault, 

    #[msg("vault at index is not the vault sent in the instruction")]
    VaultIndexHasDifferentVault, 

    #[msg("max whitelisted vaults reached")]
    MaxWhitelistedVaultsReached,

    #[msg("invalid adding vault state")]
    InvalidAddingVaultState,

    #[msg("Deposit exceeds vault cap")]
    DepositExceedsVaultCap, 

    #[msg("Incorrect Marinade State Address")]
    IncorrectMarinadeStateAddress,

    #[msg("Spl Stake Pool State field AccountType != AccountTypeStakePool")]
    AccountTypeIsNotStakePool,

    #[msg("Spl Stake Pool State account owner is not the Spl-Stake-Pool Program")]
    SplStakePoolStateAccountOwnerIsNotTheSplStakePoolProgram,

    #[msg("Deposits in this vault are disabled")]
    DepositsInThisVaultAreDisabled,
}
