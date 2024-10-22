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

    /// target amount for the next withdraw
    /// the strat should wind-down positions so this amount can be withdrawn
    /// once withdrawn (call to strat-program) and in the same tx, set this value to zero
    /// withdraw also increases "vault.locally_stored_amount" to cover "vault.tickets_target_sol_amount"
    pub next_withdraw_lst_amount: u64,

    /// reference only: "tickets_target_sol_amount" is set by the ticket-fulfiller
    pub tickets_target_sol_amount: u64,

    /// last computation of lst-token amount in the strategy.
    /// When the `common_strategy_state.strat_total_lst_amount` increases above `last_strat_lst_amount`, a profit is recorded
    /// Incremented when depositing the LST token in the strategy
    /// Reduced manually when removing LST tokens from the strategy
    /// Incremented during strategy-amount-update, if the strategy generated yield in the form of more lst tokens
    pub last_read_strat_lst_amount: u64,
    pub last_read_strat_lst_timestamp: u64, // last run of strat-price-update
}
