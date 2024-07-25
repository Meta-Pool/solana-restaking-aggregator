use anchor_lang::{error, prelude::AccountInfo, solana_program::pubkey::Pubkey, Result};
use borsh::{BorshDeserialize, BorshSerialize};
use crate::error::ErrorCode::ErrDeserializingCommonStrategyState;
// EXTERNAL state, belonging to strategy-programs
// Note for V2: Dual-LST strategies:
// A dual-token strategy-program must create 2 CommonVaultStrategyStates
// one for each token, and attach each CommonVaultStrategyState to the specific token vault
#[derive(Clone, Debug, BorshDeserialize, BorshSerialize, PartialEq)]
pub struct CommonStrategyState {

    pub discriminator: [u8; 8],

    pub lst_mint: Pubkey,

    // total lst in this strategy
    // incremented when receiving tokens from the vault
    // incremented when rewards are acquired
    // decremented when slashed
    // decremented when sending tokens to the vault
    pub strat_total_lst_amount: u64,

}

/// use this seed to compute strategy auth & from that strategy ATA where to send LSTs
// strat_state_account is stored in VaultStrategyRelationEntry as common_strategy_state: Pubkey, 
// #[account(
//     seeds = [
//     STAT_AUTHORITY_SEED,
//     strat_state_account.key().as_ref()
// ])]
// authority: UncheckedAccount<'info>,
// ----
// #[account(
//     associated_token::mint = lst_mint,
//     associated_token::authority = authority,
// )]
// lst_deposit: Account<'info, TokenAccount>,
pub const STRAT_AUTHORITY_SEED: &'static [u8] = b"authority";
// also ts/js:
// const [stratAuth, stratAuthBump] = PublicKey.findProgramAddressSync(
//   [stratStateAccount.publicKey.toBuffer(), STRAT_AUTHORITY_SEED]
//    ,stratProgramAddress);
// const [stratAta, stratAtaBump] = PublicKey.findProgramAddressSync(
//   [stratAuth.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), lstMint.toBuffer(),
//    ,&ASSOCIATED_TOKEN_PROGRAM_ID]);

/// deserialize common_strategy_state: &AccountInfo
pub fn deserialize(common_strategy_state: &AccountInfo)-> Result<CommonStrategyState> {
    let mut data_slice = &common_strategy_state.data.borrow()[..];
    CommonStrategyState::deserialize(&mut data_slice).map_err(|_err|{error!(ErrDeserializingCommonStrategyState)})
}