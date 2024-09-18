use crate::{constants::*, error::ErrorCode, MainVaultState, VaultStrategyRelationEntry};
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
/// signal the strategy how much lst we need to withdraw
pub struct SetNextWithdrawAmount<'info> {
    #[account(has_one = operator_auth)]
    pub main_state: Account<'info, MainVaultState>,

    // the one in main_state
    #[account()]
    pub operator_auth: Signer<'info>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the system
    #[account(mut,
        has_one = main_state,
        has_one = lst_mint,
        has_one = common_strategy_state,
        seeds = [
            VAULT_STRAT_ENTRY_SEED,
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strategy_relation_entry: Account<'info, VaultStrategyRelationEntry>,

    /// must be the one mentioned in vault_strategy_relation_entry
    /// CHECK: external acc manually deserialized
    pub common_strategy_state: UncheckedAccount<'info>,

    /// CHECK: get vault Auth PDA
    /// for temp-ATA to move lst from strat back to the vault
    #[account(
        seeds = [
            crate::VAULT_STRAT_WITHDRAW_ATA_AUTH_SEED,
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strat_withdraw_auth: UncheckedAccount<'info>,

    /// temp-ATA to move lst from strat back to the vault
    #[account(mut,
        associated_token::mint = lst_mint,
        associated_token::authority = vault_strat_withdraw_auth,
    )]
    lst_withdraw_account: Account<'info, TokenAccount>,
}

pub fn handle_set_next_withdraw_amount(
    ctx: Context<SetNextWithdrawAmount>,
    lst_amount: u64,
) -> Result<()> {
    require_gte!(
        lst_amount,
        ctx.accounts.lst_withdraw_account.amount,
        ErrorCode::MustWithdrawAllPendingLst
    );
    // set field next_withdraw_lst_amount
    ctx.accounts
        .vault_strategy_relation_entry
        .next_withdraw_lst_amount = lst_amount;
    Ok(())
}
