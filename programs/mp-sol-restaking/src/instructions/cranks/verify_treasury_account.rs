use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

// this fn returns Some(u64) if the treasury account is valid and ready to receive transfers
// or None if it is not. This fn does not fail on an invalid treasury account, an invalid
// treasury account configured in State means the protocol does not want to receive fees
pub fn verify_treasury_mp_sol_balance<'info>(
    mp_sol_mint: &Pubkey,
    treasury_mp_sol_account: &AccountInfo<'info>,
) -> Option<u64> {
    if treasury_mp_sol_account.owner != &anchor_spl::token::ID {
        msg!(
            "treasury_mp_sol_account {} is not a token account",
            treasury_mp_sol_account.key
        );
        return None; // Not an error. Admins may decide to reject fee transfers to themselves
    }
    match TokenAccount::try_deserialize(&mut treasury_mp_sol_account.data.borrow_mut().as_ref()) {
        Ok(token_account) => {
            if token_account.mint.eq(mp_sol_mint) {
                Some(token_account.amount)
            } else {
                msg!(
                    "treasury_mp_sol_account {} has wrong mint {}. Expected {}",
                    treasury_mp_sol_account.key,
                    token_account.mint,
                    mp_sol_mint
                );
                None // Not an error. Admins may decide to reject fee transfers to themselves
            }
        }
        Err(e) => {
            msg!(
                "treasury_mp_sol_account {} can not be parsed as token account ({})",
                treasury_mp_sol_account.key,
                e
            );
            None // Not an error. Admins may decide to reject fee transfers to themselves
        }
    }
}
