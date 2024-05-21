use anchor_lang::prelude::*;

/// state created when a CommonVaultStrategyState is attached to a secondary-vault
/// main_state + lst_mint + common_strategy_state => VaultStrategyRelationEntry PDA
#[account]
#[derive(InitSpace)]
pub struct VaultStrategyRelationEntry {

    pub main_state: Pubkey,

    ///  main_state + lst_mint => secondary-vault PDA
    pub lst_mint: Pubkey,

    /// Several common_strategy_state accounts can exist for a single strategy_program_code
    /// Each common_strategy_state account has a common first part struct `CommonVaultStrategyState`
    /// and it references A SPECIFIC LST mint & vault. Yields are computed in that lst.
    /// PDAs:
    /// this-program + main_state + lst_mint + common_strategy_state => VaultStrategyRelationEntry PDA
    /// strategy_program_code + common_strategy_state + "AUTH" => strategy-Auth-PDA
    /// associated-token-program + lst_mint + strategy-Auth-PDA => strategy-lst-ATA holding CommonVaultStrategyState.locally_stored_amount
    pub common_strategy_state: Pubkey,

    /// strategy program code, owner of common_strategy_state
    pub strategy_program_code: Pubkey,
    
    /// target amount for this strat state
    /// set by DAO voting.
    /// if 0 => only-withdraw mode, the strat should be winding_down
    pub lst_amount_target: u64,

    /// "tickets_target_sol_amount" is set by the ticket-fulfiller crank, so the strat removes tokens from external-programs
    /// increasing "locally_stored_amount" until it covers "tickets_target_sol_amount"
    /// in order to compute how much tokens are free to send to external-programs, do: locally_stored_amount - lst_value(tickets_target_sol_amount)
    pub tickets_target_sol_amount: u64,

    /// last computation of lst-token amount in the strategy.
    /// When the `common_strategy_state.strat_total_lst_amount` increases above `last_strat_lst_amount`, a profit is recorded
    /// Incremented when depositing the LST token in the strategy
    /// Reduced manually when removing LST tokens from the strategy
    /// Incremented during strategy-amount-update, if the strategy generated yield in the form of more lst tokens
    pub last_read_strat_lst_amount: u64,
    pub last_read_strat_lst_timestamp: u64, // last run of strat-price-update
}

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

