PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json
if [ $# -ne 1 ]; then
  echo "Error: Please provide buffer address as argument"
  set -ex
  solana program show --buffers
  exit 1
fi
echo Buffer: $1
solana program write-buffer \
    -u mainnet-beta \
    target/deploy/$PROGRAM_LIB_NAME.so \
    --buffer $1