set -ex
solana-verify get-executable-hash target/deploy/mp_sol_restaking.so 
solana-verify -u mainnet-beta get-program-hash MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW
