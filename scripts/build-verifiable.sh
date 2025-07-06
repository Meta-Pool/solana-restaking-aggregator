# cargo install solana-verify
set -ex
PROGRAM_LIB_NAME=mp_sol_restaking
echo anchor-build to get target/idl and target/types
anchor build -p $PROGRAM_LIB_NAME
mkdir -p res
cp -u target/idl/mp_sol_restaking.json res
cp -u target/types/mp_sol_restaking.ts res

echo solana-verify build to deploy
solana-verify build --library-name $PROGRAM_LIB_NAME
#solana-verify get-executable-hash target/deploy/$PROGRAM_LIB_NAME.so

echo ------------------------------------------
echo CHECK mainnet program SIZE BEFORE UPGRADE
solana program show -u m MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW
ls -l target/deploy/$PROGRAM_LIB_NAME.so
echo ------------------------------------------
