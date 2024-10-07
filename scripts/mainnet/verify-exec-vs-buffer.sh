if [ $# -ne 1 ]; then
  echo "Error: Please provide buffer address as argument"
  set -ex
  solana program show --buffers
  exit 1
fi
echo Buffer: $1
set -ex
solana-verify get-executable-hash target/deploy/mp_sol_restaking.so
solana-verify -u mainnet-beta get-buffer-hash $1
