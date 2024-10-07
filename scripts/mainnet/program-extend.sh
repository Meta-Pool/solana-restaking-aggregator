if [ $# -ne 1 ]; then
  echo "Error: Please provide amount to expand in bytes"
  exit 1
fi
set -ex
solana program extend MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW $1 \
    -u mainnet-beta \
    -k ~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json
