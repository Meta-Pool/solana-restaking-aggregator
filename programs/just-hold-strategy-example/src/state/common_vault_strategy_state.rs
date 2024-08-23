use anchor_lang::prelude::*;

// Note for V2: Dual-LST strategies:
// A dual-token strategy-program must create 2 CommonVaultStrategyStates
// one for each token, and attach each CommonVaultStrategyState to the specific token vault
#[derive(InitSpace)]
#[account]
pub struct CommonVaultStrategyState {

    pub lst_mint: Pubkey,

    /// total lst in this strategy
    /// incremented when receiving tokens from the vault
    /// incremented when rewards are acquired
    /// decremented when slashed
    /// decremented when sending tokens to the vault (via intermediate ATA)
    pub strat_total_lst_amount: u64,

}

