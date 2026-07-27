use crate::{error::ErrorCode, MainVaultState, SecondaryVaultState, UnstakeTicket};
use anchor_lang::{prelude::*, solana_program::pubkey};
use anchor_spl::token::{burn, Burn, Mint, Token, TokenAccount};
use shared_lib::lst_amount_to_sol_value;

const INCIDENT_MAIN_STATE: Pubkey = pubkey!("mpsoLeuCF3LwrJWbzxNd81xRafePFfPhsNvGsAMhUAA");
const INCIDENT_MSOL_MINT: Pubkey = pubkey!("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
const INCIDENT_MSOL_VAULT: Pubkey = pubkey!("5LsQaaarGCUcpB5rSL1DN9kH1ibQ99EKk4NPEvwxQtDq");
const INCIDENT_MPSOL_MINT: Pubkey = pubkey!("mPsoLV53uAGXnPJw63W91t2VDqCVZcU5rTh3PWzxnLr");
const INCIDENT_TREASURY: Pubkey = pubkey!("Gde12qXKF3fALWTAQgzyqBhNE67eBxdmJDLw3EiTu4eu");
const INCIDENT_BENEFICIARY: Pubkey = pubkey!("E67CdAfSNJ6xTBtR9rZDpMjhbE3agJMEzgZFV9H6d4Jg");
const INCIDENT_TICKET_ONE: Pubkey = pubkey!("GGkyi3GBfdhFrzMeJ1rq79U8sx9GdsET9R3enaFJYrjd");
const INCIDENT_TICKET_TWO: Pubkey = pubkey!("A3u1ozkcuCeA8fSy67Q3SPM6shZxkq7bgTmHcNNCrRmt");

const FAKE_MSOL_AMOUNT: u64 = 1_325_751_927_273_430;
const FRAUDULENT_PERFORMANCE_FEE_MPSOL: u64 = 282_209_079_972;
const INFLATED_TICKET_ONE_SOL_VALUE: u64 = 2_613_335_346;
const INFLATED_TICKET_TWO_SOL_VALUE: u64 = 1_580_481_324_637;
const CORRECTED_TICKET_ONE_SOL_VALUE: u64 = 1_193_671_382;
const CORRECTED_TICKET_TWO_SOL_VALUE: u64 = 1_193_671_382;
const EXPECTED_BACKING_SOL_VALUE: u64 = 1_850_876_467_964_836;
const EXPECTED_OUTSTANDING_TICKETS_SOL_VALUE: u64 = 1_987_789_388_349;
const EXPECTED_MSOL_VAULT_TOTAL_LST_AMOUNT: u64 = 1_326_150_206_353_955;
const EXPECTED_MSOL_IN_STRATEGIES_AMOUNT: u64 = 1_325_992_165_887_336;
const EXPECTED_MSOL_SOL_PRICE_P32: u64 = 5_997_869_740;
const EXPECTED_MPSOL_SUPPLY: u64 = 1_169_912_964_281;
const EXPECTED_TREASURY_MPSOL_AMOUNT: u64 = 306_973_238_762;
const INCIDENT_RECOVERY_PENDING_BACKING_THRESHOLD: u64 = 1_000_000 * 1_000_000_000;

pub fn require_july_2026_incident_recovered(main_state: &Account<MainVaultState>) -> Result<()> {
    if main_state.key() == INCIDENT_MAIN_STATE {
        require_gt!(
            INCIDENT_RECOVERY_PENDING_BACKING_THRESHOLD,
            main_state.backing_sol_value,
            ErrorCode::IncidentRecoveryPending
        );
    }
    Ok(())
}

#[derive(Accounts)]
pub struct RecoverJuly2026Incident<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        address = INCIDENT_MAIN_STATE,
        has_one = admin,
        has_one = mpsol_mint,
    )]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: Address is restricted to the incident's mSOL mint.
    #[account(address = INCIDENT_MSOL_MINT)]
    pub lst_mint: UncheckedAccount<'info>,

    #[account(
        mut,
        address = INCIDENT_MSOL_VAULT,
        has_one = lst_mint,
        seeds = [
            &main_state.key().to_bytes(),
            &lst_mint.key().to_bytes(),
        ],
        bump,
    )]
    pub vault_state: Account<'info, SecondaryVaultState>,

    #[account(mut, address = INCIDENT_MPSOL_MINT)]
    pub mpsol_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = INCIDENT_TREASURY,
        token::mint = mpsol_mint,
        token::authority = admin,
    )]
    pub treasury_mpsol_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = INCIDENT_TICKET_ONE,
        has_one = main_state,
        constraint = ticket_one.beneficiary == INCIDENT_BENEFICIARY,
    )]
    pub ticket_one: Account<'info, UnstakeTicket>,

    #[account(
        mut,
        address = INCIDENT_TICKET_TWO,
        has_one = main_state,
        constraint = ticket_two.beneficiary == INCIDENT_BENEFICIARY,
    )]
    pub ticket_two: Account<'info, UnstakeTicket>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_recover_july_2026_incident(ctx: Context<RecoverJuly2026Incident>) -> Result<()> {
    require_eq!(
        ctx.accounts.ticket_one.ticket_sol_value,
        INFLATED_TICKET_ONE_SOL_VALUE,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.ticket_two.ticket_sol_value,
        INFLATED_TICKET_TWO_SOL_VALUE,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.main_state.backing_sol_value,
        EXPECTED_BACKING_SOL_VALUE,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.main_state.outstanding_tickets_sol_value,
        EXPECTED_OUTSTANDING_TICKETS_SOL_VALUE,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.vault_state.vault_total_lst_amount,
        EXPECTED_MSOL_VAULT_TOTAL_LST_AMOUNT,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.vault_state.in_strategies_amount,
        EXPECTED_MSOL_IN_STRATEGIES_AMOUNT,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.vault_state.lst_sol_price_p32,
        EXPECTED_MSOL_SOL_PRICE_P32,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.mpsol_mint.supply,
        EXPECTED_MPSOL_SUPPLY,
        ErrorCode::IncidentRecoveryStateMismatch
    );
    require_eq!(
        ctx.accounts.treasury_mpsol_account.amount,
        EXPECTED_TREASURY_MPSOL_AMOUNT,
        ErrorCode::IncidentRecoveryStateMismatch
    );

    let inflated_ticket_total = INFLATED_TICKET_ONE_SOL_VALUE
        .checked_add(INFLATED_TICKET_TWO_SOL_VALUE)
        .ok_or(ErrorCode::IncidentRecoveryArithmeticError)?;
    let corrected_ticket_total = CORRECTED_TICKET_ONE_SOL_VALUE
        .checked_add(CORRECTED_TICKET_TWO_SOL_VALUE)
        .ok_or(ErrorCode::IncidentRecoveryArithmeticError)?;
    require_gte!(
        ctx.accounts.main_state.outstanding_tickets_sol_value,
        inflated_ticket_total,
        ErrorCode::IncidentRecoveryStateMismatch
    );

    let fake_msol_sol_value =
        lst_amount_to_sol_value(FAKE_MSOL_AMOUNT, ctx.accounts.vault_state.lst_sol_price_p32);
    ctx.accounts.main_state.backing_sol_value = ctx
        .accounts
        .main_state
        .backing_sol_value
        .checked_add(inflated_ticket_total)
        .and_then(|value| value.checked_sub(fake_msol_sol_value))
        .and_then(|value| value.checked_sub(corrected_ticket_total))
        .ok_or(ErrorCode::IncidentRecoveryArithmeticError)?;
    ctx.accounts.main_state.outstanding_tickets_sol_value = ctx
        .accounts
        .main_state
        .outstanding_tickets_sol_value
        .checked_sub(inflated_ticket_total)
        .and_then(|value| value.checked_add(corrected_ticket_total))
        .ok_or(ErrorCode::IncidentRecoveryArithmeticError)?;

    ctx.accounts.vault_state.vault_total_lst_amount -= FAKE_MSOL_AMOUNT;
    ctx.accounts.vault_state.in_strategies_amount -= FAKE_MSOL_AMOUNT;
    ctx.accounts.ticket_one.ticket_sol_value = CORRECTED_TICKET_ONE_SOL_VALUE;
    ctx.accounts.ticket_two.ticket_sol_value = CORRECTED_TICKET_TWO_SOL_VALUE;

    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mpsol_mint.to_account_info(),
                from: ctx.accounts.treasury_mpsol_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        FRAUDULENT_PERFORMANCE_FEE_MPSOL,
    )?;

    emit!(crate::events::July2026IncidentRecoveryEvent {
        main_state: ctx.accounts.main_state.key(),
        fake_msol_amount: FAKE_MSOL_AMOUNT,
        fake_msol_sol_value,
        burned_mpsol_amount: FRAUDULENT_PERFORMANCE_FEE_MPSOL,
        corrected_ticket_one_sol_value: CORRECTED_TICKET_ONE_SOL_VALUE,
        corrected_ticket_two_sol_value: CORRECTED_TICKET_TWO_SOL_VALUE,
        main_vault_backing_sol_value: ctx.accounts.main_state.backing_sol_value,
        outstanding_tickets_sol_value: ctx.accounts.main_state.outstanding_tickets_sol_value,
    });

    Ok(())
}
