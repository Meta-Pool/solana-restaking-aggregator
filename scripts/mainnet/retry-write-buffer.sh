PROGRAM_LIB_NAME=mp_sol_restaking
PROGRAM_KEYPAIR=~/.config/solana/MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW.json
UPGRADE_AUTHORITY=~/.config/solana/MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json
if [ ! -f buffer-signer.json ]; then
  echo "Error: Please create buffer-signer.json"
  echo "with the buffer seed and executing"
  echo "> solana-keygen recover -o buffer-signer.json"
  exit 1
fi
BUFFER_ADDRESS=$(solana-keygen pubkey buffer-signer.json)
echo Abot to continue write to buffer: $BUFFER_ADDRESS
solana program write-buffer \
    -u mainnet-beta \
    target/deploy/$PROGRAM_LIB_NAME.so \
    --buffer $BUFFER_ADDRESS
