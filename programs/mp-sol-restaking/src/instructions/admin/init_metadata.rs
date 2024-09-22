use crate::constants::*;
use crate::state::MainVaultState;
use anchor_lang::prelude::*;

use anchor_spl::metadata::{
    create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    Metadata as Metaplex,
};

use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct InitMetadata<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(has_one = admin, has_one = mpsol_mint)]
    pub main_state: Account<'info, MainVaultState>,

    /// CHECK: Mint Auth PDA
    #[account(
        seeds = [
            &main_state.key().to_bytes(),
            MAIN_VAULT_MINT_AUTH_SEED
        ],
        bump
    )]
    pub mpsol_mint_pda_authority: UncheckedAccount<'info>,

    #[account(
        mint::decimals = 9, // all mints must have 9 decimals, to simplify x/SOL price calculations
        mint::authority = mpsol_mint_pda_authority
        )]
    pub mpsol_mint: Account<'info, Mint>,

    /// CHECK: New Metaplex Account being created
    /// note: metaplex uses a different way to compute PDAs than anchor
    /// this should be PDA("metadata",token_metadata_program,mint) program:token_metadata_program
    /// yes, token_metadata_program is repeated in the PDA generation
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

pub fn handle_init_metadata(ctx: Context<InitMetadata>) -> Result<()> {
    let token_data: DataV2 = DataV2 {
        name: String::from("metapool.app Restake Aggregator"),
        symbol: String::from("mpSOL"),
        uri: String::from("https://metapool.app/static/mpSOL.json"),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let seeds = [
        &ctx.accounts.main_state.key().to_bytes(),
        MAIN_VAULT_MINT_AUTH_SEED,
        &[ctx.bumps.mpsol_mint_pda_authority],
    ];
    let signer = [&seeds[..]];

    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            payer: ctx.accounts.admin.to_account_info(),
            update_authority: ctx.accounts.mpsol_mint_pda_authority.to_account_info(),
            mint: ctx.accounts.mpsol_mint.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            mint_authority: ctx.accounts.mpsol_mint_pda_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        &signer,
    );

    create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;

    msg!("Token mint created successfully.");

    Ok(())
}
