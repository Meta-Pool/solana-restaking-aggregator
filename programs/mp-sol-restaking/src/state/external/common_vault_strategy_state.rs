// EXTERNAL state, belonging to strategy-programs
// Note for V2: Dual-LST strategies:
// A dual-token strategy-program must create 2 CommonVaultStrategyStates
// one for each token, and attach each CommonVaultStrategyState to the specific token vault
#[account]
pub struct CommonVaultStrategyState {

    pub lst_mint: Pubkey,

    // total lst in this strategy
    // incremented when receiving tokens from the vault
    // incremented when rewards are acquired
    // decremented when slashed
    // decremented when sending tokens to the vault
    /// invariant: vault_total_token_amount = in_external_program_amount + locally_stored_amount
    pub strat_total_lst_amount: u64,

    /// lst amount here (not in external yield-generating programs)
    /// invariant: strat_token_amount = in_external_program_amount + locally_stored_amount
    /// invariant: locally_stored_amount = strat_lst_account.amount
    pub locally_stored_amount: u64,

    /// lst amount sent to external yield-generating programs (belongs to this strat, but not in strat_lst_account)
    /// invariant: strat_lst_amount = in_external_program_amount + locally_stored_amount
    pub in_external_program_amount: u64,

}

