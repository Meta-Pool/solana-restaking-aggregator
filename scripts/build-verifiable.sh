# cargo install solana-verify
PROGRAM_LIB_NAME=mp_sol_restaking
solana-verify build --library-name $PROGRAM_LIB_NAME
solana-verify get-executable-hash target/deploy/$PROGRAM_LIB_NAME.so
