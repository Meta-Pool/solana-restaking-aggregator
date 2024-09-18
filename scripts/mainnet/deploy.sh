PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json 
echo SIZE
solana program show -u m $PROGRAM_KEYPAIR  
ls -l target/deploy/$PROGRAM_LIB_NAME.so
echo DEPLOY
solana program deploy \
    -u mainnet-beta \
    target/deploy/$PROGRAM_LIB_NAME.so \
    --program-id $PROGRAM_KEYPAIR \
    --upgrade-authority $UPGRADE_AUTHORITY
