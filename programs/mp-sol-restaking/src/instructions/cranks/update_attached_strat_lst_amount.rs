use crate::{
    constants::*, error::ErrorCode, external::common_strategy_state, MainVaultState,
    SecondaryVaultState, VaultStrategyRelationEntry,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};
use shared_lib::{apply_bp, lst_amount_to_sol_value, sol_value_to_mpsol_amount};

#[derive(Accounts)]
/// permissionless
/// check how much lst is now in the strategy
/// if more lst than before => yield
pub struct UpdateAttachedStratLstAmount<'info> {
    #[account(mut, has_one = mpsol_mint)]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: no need to decode mint
    #[account()]
    pub lst_mint: UncheckedAccount<'info>,

    #[account(mut,
        has_one = lst_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump
    )]
    /// secondary-vault state
    pub vault_state: Account<'info, SecondaryVaultState>,

    /// vault->strat relation entry
    /// if this account exists, the common_strategy_state was correctly attached to the system
    #[account(mut,
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

    /// CHECK: PDA strat authority, used to compute ATA
    #[account(
        seeds = [
            AUTHORITY_SEED,
            common_strategy_state.key().as_ref()
        ],
        bump,
        seeds::program = vault_strategy_relation_entry.strategy_program_code
    )]
    strategy_authority: UncheckedAccount<'info>,

    #[account(
        associated_token::mint = lst_mint,
        associated_token::authority = strategy_authority,
    )]
    strategy_deposit_account: Account<'info, TokenAccount>,

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
    #[account(
        associated_token::mint = lst_mint,
        associated_token::authority = vault_strat_withdraw_auth,
    )]
    lst_withdraw_account: Account<'info, TokenAccount>,

    #[account(mut, mint::authority = mpsol_mint_authority)]
    pub mpsol_mint: Box<Account<'info, Mint>>,
    /// CHECK: Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            MAIN_VAULT_MINT_AUTH_SEED
        ],
        bump
    )]
    pub mpsol_mint_authority: UncheckedAccount<'info>,

    #[account(mut, token::mint = mpsol_mint)]
    pub treasury_mpsol_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_update_attached_strat_lst_amount(
    ctx: Context<UpdateAttachedStratLstAmount>,
) -> Result<()> {
    //
    // see if the strat has now more lst than before
    //
    // Phase 1. Collect values
    let last_read_lst_amount = ctx
        .accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_amount;

    // read from external strategy state
    let common_strategy_state =
        common_strategy_state::deserialize(&mut ctx.accounts.common_strategy_state)?;
    require_keys_eq!(common_strategy_state.lst_mint, ctx.accounts.lst_mint.key());
    let strat_reported_lst_amount = common_strategy_state.strat_total_lst_amount
        + ctx.accounts.strategy_deposit_account.amount
        + ctx.accounts.lst_withdraw_account.amount;

    let (profit, loss) = {
        // Phase 2. ?
        if strat_reported_lst_amount >= last_read_lst_amount {
            // Phase 3. Profit!
            (strat_reported_lst_amount - last_read_lst_amount, 0)
        } else {
            // loss :(
            (0, last_read_lst_amount - strat_reported_lst_amount)
        }
    };

    if profit == 0 || loss > 0 {
        // during the epoch, for leveraged strategies the SOL borrow fees can cause
        // a temporal loss because the LST hasn't updated its price yet,
        // in that case we ignore this update call. This instruction should be called
        // after the LST has updated it's price (4 hs after epoch start for example)
        return Ok(());
    }

    // if the amount of LSTs changed, update accounting in the secondary_vault
    // add to the total
    ctx.accounts.vault_state.vault_total_lst_amount =
        ctx.accounts.vault_state.vault_total_lst_amount + profit - loss;
    // but it is in an strategy
    ctx.accounts.vault_state.in_strategies_amount =
        ctx.accounts.vault_state.in_strategies_amount + profit - loss;

    // compute profit/slashing in terms of SOL-value, to update main-state backing_sol_value
    // LST/SOL price must not be stale
    check_price_not_stale(ctx.accounts.vault_state.lst_sol_price_timestamp)?;
    let profit_sol_value =
        lst_amount_to_sol_value(profit, ctx.accounts.vault_state.lst_sol_price_p32);
    let slashing_sol_value =
        lst_amount_to_sol_value(loss, ctx.accounts.vault_state.lst_sol_price_p32);

    // update main_state.backing_sol_value with delta sol-value
    ctx.accounts.main_state.backing_sol_value =
        ctx.accounts.main_state.backing_sol_value + profit_sol_value - slashing_sol_value;

    // to finalize:
    // update last read amount and timestamp in vault_strategy_relation_entry
    ctx.accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_amount = strat_reported_lst_amount;
    ctx.accounts
        .vault_strategy_relation_entry
        .last_read_strat_lst_timestamp = Clock::get().unwrap().unix_timestamp as u64;

    emit!(crate::events::UpdateAttachedStratLstAmountEvent {
        main_state: ctx.accounts.main_state.key(),
        lst_mint: ctx.accounts.lst_mint.key(),
        vault_strategy_relation_entry: ctx.accounts.vault_strategy_relation_entry.key(),
        old_lst_amount: last_read_lst_amount,
        new_lst_amount: strat_reported_lst_amount,
        lst_price_p32: ctx.accounts.vault_state.lst_sol_price_p32,
        main_vault_backing_sol_value: ctx.accounts.main_state.backing_sol_value,
    });

    // compute protocol fees
    let performance_fee_mpsol_amount = {
        let performance_fee_sol_value =
            apply_bp(profit_sol_value, ctx.accounts.main_state.performance_fee_bp);
        sol_value_to_mpsol_amount(
            performance_fee_sol_value,
            ctx.accounts.main_state.backing_sol_value,
            ctx.accounts.mpsol_mint.supply,
        )
    };

    if performance_fee_mpsol_amount > 0 {
        if let Some(treasury_mpsol_account) = ctx.accounts.main_state.treasury_mpsol_account {
            require_keys_eq!(
                treasury_mpsol_account,
                ctx.accounts.treasury_mpsol_account.key(),
                ErrorCode::InvalidTreasuryMpsolAccount
            );

            // performance fee
            // mint mpSOL for the protocol treasury
            mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.mpsol_mint.to_account_info(),
                        to: ctx.accounts.treasury_mpsol_account.to_account_info(),
                        authority: ctx.accounts.mpsol_mint_authority.to_account_info(),
                    },
                    &[&[
                        &ctx.accounts.main_state.key().to_bytes(),
                        MAIN_VAULT_MINT_AUTH_SEED,
                        &[ctx.bumps.mpsol_mint_authority],
                    ]],
                ),
                performance_fee_mpsol_amount,
            )?;
        }
    }

    Ok(())
}

pub const ONE_DAY_IN_SECONDS: u64 = 60 * 60 * 24;

fn check_price_not_stale_seconds(
    token_sol_price_timestamp: u64,
    max_seconds_allowed: u64,
) -> Result<()> {
    let now_ts = Clock::get().unwrap().unix_timestamp as u64;
    let elapsed_seconds = now_ts - token_sol_price_timestamp;
    require_gte!(
        max_seconds_allowed,
        elapsed_seconds,
        ErrorCode::TokenSolPriceIsStale
    );
    Ok(())
}

pub fn check_price_not_stale(token_sol_price_timestamp: u64) -> Result<()> {
    check_price_not_stale_seconds(token_sol_price_timestamp, ONE_DAY_IN_SECONDS)
}
