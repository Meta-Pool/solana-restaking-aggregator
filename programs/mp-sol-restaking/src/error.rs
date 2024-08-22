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

    #[msg("Invalid Stored Lst Price")]
    InvalidStoredLstPrice,

    #[msg("Unstake amount too small")]
    UnstakeAmountTooSmall, 

    #[msg("Not enough SOL value in ticket ")]
    NotEnoughSolValueInTicket,

    #[msg("Withdraw amount too small")]
    WithdrawAmountToSmall, 

    #[msg("Ticket is not due yet")]
    TicketIsNotDueYet,

    #[msg("Not Enough Lst in Vault")]
    NotEnoughLstInVault,

    #[msg("Missing Lst State in Remaining Accounts")]
    MissingLstStateInRemainingAccounts,

    #[msg("Can't Leave Dust In Ticket, either remove all or leave a significant amount")]
    CantLeaveDustInTicket,

    #[msg("Invalid Treasury Mpsol Account")]
    InvalidTreasuryMpsolAccount,

    #[msg("Performance Fee Too High")]
    PerformanceFeeTooHigh,

    #[msg("Err deserializing common strategy state")]
    ErrDeserializingCommonStrategyState,

    #[msg("new strategy lst amount should be 0")]
    NewStrategyLstAmountShouldBeZero,

    #[msg("amount is 0")]
    AmountIsZero

}

