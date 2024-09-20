pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW");

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;
#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Metapool.app Restake Aggregator",
    project_url: "https://metapool.app",
    contacts: "link:https://docs.metapool.app,link:https://discord.gg/9DzPZCzzxp",
    policy: "https://docs.metapool.app/master/security",
    preferred_languages: "en",
    source_code: "https://github.com/Meta-Pool/solana-restaking",
    source_release: "v1.0",
    auditors: "https://docs.metapool.app/master/security/audits"
}

#[program]
pub mod mp_sol_restaking {
    use super::*;

    // ------------------
    // admin
    // ------------------
    pub fn initialize(ctx: Context<Initialize>, operator_auth: Pubkey) -> Result<()> {
        initialize::handle_initialize(ctx, operator_auth)
    }

    pub fn init_metadata(ctx: Context<InitMetadata>) -> Result<()> {
        init_metadata::handle_init_metadata(ctx)
    }

    pub fn create_secondary_vault(ctx: Context<CreateSecondaryVault>) -> Result<()> {
        create_secondary_vault::handle_create_secondary_vault(ctx)
    }

    pub fn configure_main_vault(
        ctx: Context<ConfigureMainVault>,
        values: ConfigureMainVaultValues,
    ) -> Result<()> {
        configure_main_vault::handle_configure_main_vault(ctx, values)
    }

    pub fn configure_secondary_vault(
        ctx: Context<ConfigureSecondaryVault>,
        values: ConfigureSecondaryVaultValues,
    ) -> Result<()> {
        configure_secondary_vault::handle_configure_secondary_vault(ctx, values)
    }

    pub fn attach_common_strategy_state(ctx: Context<AttachCommonStrategyState>) -> Result<()> {
        attach_common_strategy_state::handle_attach_common_strategy_state(ctx)
    }

    // ------------------
    // cranks
    // ------------------
    pub fn update_attached_strat_lst_amount(
        ctx: Context<UpdateAttachedStratLstAmount>,
    ) -> Result<()> {
        handle_update_attached_strat_lst_amount(ctx)
    }

    pub fn update_vault_token_sol_price(ctx: Context<UpdateVaultTokenSolPrice>) -> Result<()> {
        handle_update_vault_token_sol_price(ctx)
    }

    pub fn update_vault_ticket_target(
        ctx: Context<UpdateVaultTicketTarget>,
        new_ticket_target_sol_amount: u64,
    ) -> Result<()> {
        handle_update_vault_ticket_target(ctx, new_ticket_target_sol_amount)
    }

    pub fn get_lst_from_strat(ctx: Context<GetLstFromStrat>) -> Result<()> {
        handle_get_lst_from_strat(ctx)
    }

    pub fn transfer_lst_to_strat(ctx: Context<TransferLstToStrat>, lst_amount: u64) -> Result<()> {
        handle_transfer_lst_to_strat(ctx, lst_amount)
    }

    pub fn set_next_withdraw_amount(
        ctx: Context<SetNextWithdrawAmount>,
        lst_amount: u64,
    ) -> Result<()> {
        handle_set_next_withdraw_amount(ctx, lst_amount)
    }

    // ------------------
    // users
    // ------------------
    pub fn stake(ctx: Context<Stake>, lst_amount: u64, ref_code: u32) -> Result<()> {
        users::stake::handle_stake(ctx, lst_amount, ref_code)
    }

    pub fn unstake(ctx: Context<Unstake>, mpsol_amount: u64) -> Result<()> {
        users::unstake::handle_unstake(ctx, mpsol_amount)
    }

    pub fn ticket_claim(ctx: Context<TicketClaim>, withdraw_sol_value_amount: u64) -> Result<()> {
        users::ticket_claim::handle_ticket_claim(ctx, withdraw_sol_value_amount)
    }
}
