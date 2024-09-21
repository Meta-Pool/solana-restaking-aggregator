PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/DEVYT7nSvD4gzP6BH2N1ubUamErS4TXtBYwdVrFBBVr.json 
echo SIZE
solana program show -u d $PROGRAM_KEYPAIR  
ls -l target/deploy/$PROGRAM_LIB_NAME.so
echo current account
solana address -k $UPGRADE_AUTHORITY
solana balance -u d -k $UPGRADE_AUTHORITY
echo DEPLOY?
read -p "Press Enter to continue" </dev/tty
solana program deploy \
    -u d \
    target/deploy/$PROGRAM_LIB_NAME.so \
    --program-id $PROGRAM_KEYPAIR \
    -k $UPGRADE_AUTHORITY --upgrade-authority $UPGRADE_AUTHORITY
