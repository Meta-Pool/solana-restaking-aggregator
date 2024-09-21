PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json
if [ ! -f buffer-signer.json ]; then
    solana-keygen recover -o buffer-signer.json
fi
solana program deploy \
    -u mainnet-beta \
    target/deploy/$PROGRAM_LIB_NAME.so \
    --program-id $PROGRAM_KEYPAIR \
    --upgrade-authority $UPGRADE_AUTHORITY \
    --buffer buffer-signer.json --max-sign-attempts 2 \
    && rm buffer-signer.json
