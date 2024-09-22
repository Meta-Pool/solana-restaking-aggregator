PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json
echo SIZE
solana program show -u m $PROGRAM_KEYPAIR
ls -l target/deploy/$PROGRAM_LIB_NAME.so
echo current account
solana address
solana balance -u m
echo WRITE-BUFFER?
read -p "Press Enter to continue" </dev/tty
solana program write-buffer \
    -u mainnet-beta \
    target/deploy/$PROGRAM_LIB_NAME.so