use crate::{external::common_strategy_state, state::{MainVaultState, SecondaryVaultState, VaultStrategyRelationEntry}};
use anchor_lang::prelude::*;

/// Note: Before adding a strategy
/// THE CONTRACT CODE OF THE STRAT HAS TO BE VERIFIED
/// it is important to ensure that the STRAT code is valid
/// with full backing and permissionless unstake
#[derive(Accounts)]
pub struct AttachCommonStrategyState<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(has_one=admin)]
    pub main_state: Account<'info, MainVaultState>,

    #[account()]
    /// CHECK: no need to deserialize the Mint
    pub lst_mint: UncheckedAccount<'info>,

    // secondary vaults are PDAs of main_state
    // only this program & main_state can create a secondary vault
    #[account(
        has_one = lst_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    pub vault_state: Account<'info, SecondaryVaultState>,

    #[account(owner = strategy_program_code.key())]
    /// CHECK: external, manually deserialized
    pub common_strategy_state: UncheckedAccount<'info>,

    /// account to be created
    #[account(init, payer = admin, space = 8 + VaultStrategyRelationEntry::INIT_SPACE,
        seeds = [
            &vault_state.key().to_bytes(),
            &common_strategy_state.key().to_bytes(),
        ],
        bump
    )]
    pub vault_strategy_relation_entry: Account<'info, VaultStrategyRelationEntry>,

    /// CHECK: strategy program
    #[account()]
    pub strategy_program_code: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_attach_common_strategy_state(ctx: Context<AttachCommonStrategyState>) -> Result<()> {
    // verify
    // read from external strategy state
    let common_strategy_state = common_strategy_state::deserialize(&mut ctx.accounts.common_strategy_state)?;
    require_keys_eq!(common_strategy_state.lst_mint, ctx.accounts.lst_mint.key());
    require_eq!(common_strategy_state.strat_total_lst_amount, 0, crate::error::ErrorCode::NewStrategyLstAmountShouldBeZero);

    ctx.accounts
        .vault_strategy_relation_entry
        .set_inner(VaultStrategyRelationEntry {
            main_state: ctx.accounts.main_state.key(),
            lst_mint: ctx.accounts.lst_mint.key(),
            common_strategy_state: ctx.accounts.common_strategy_state.key(),
            strategy_program_code: ctx.accounts.strategy_program_code.key(),
            next_withdraw_lst_amount: 0,
            tickets_target_sol_amount: 0,
            last_read_strat_lst_amount: 0,
            last_read_strat_lst_timestamp: 0,
        });
    Ok(())
}
