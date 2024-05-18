pub const ONE_BILLION: u64 = 1_000_000_000;

pub fn mul_div(amount: u64, numerator: u64, denominator: u64) -> u64 {
    u64::try_from((amount as u128) * (numerator as u128) / (denominator as u128)).unwrap()
}

pub fn sol_value_to_token_amount(sol_value: u64, token_sol_price: u64) -> u64 {
    mul_div(sol_value, ONE_BILLION, token_sol_price)
}
