use anchor_lang::prelude::*;

// NOTE: Anchor adds 6000 to user error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid vault index ")]
    InvalidVaultIndex, // 6000 0x1770

    #[msg("token_sol_price is stale")]
    TokenSolPriceIsStale, // 6001 0x1771

    #[msg("Withdraw amount too small")]
    WithdrawAmountTooSmall, // 6002 0x1772

    #[msg("not enough tokens in the vault")]
    NotEnoughTokensInTheVault, // 6003 0x1773

    #[msg("vault at index is not the vault sent in the instruction")]
    VaultIndexHasDifferentVault, // 6004 0x1774

    #[msg("max whitelisted vaults reached")]
    MaxWhitelistedVaultsReached,

    #[msg("invalid adding vault state")]
    InvalidAddingVaultState
}
