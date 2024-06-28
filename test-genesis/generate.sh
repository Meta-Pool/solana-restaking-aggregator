LOCAL_ADDRESS=$(echo ~/.config/solana/id.json)

# initial fetch commands of code & data for test-validator-genesis
mkdir -p generated-data
cd generated-data

# USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
# solana account -u m --output json $USDC_MINT >$USDC_MINT.json

# MARINADE_PROGRAM=MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD
# solana account -u m --output json $MARINADE_PROGRAM >$MARINADE_PROGRAM.json

MSOL_MINT=mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
solana account -u m --output json $MSOL_MINT >$MSOL_MINT.json

JITOSOL_MINT=J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn
solana account -u m --output json $JITOSOL_MINT >$JITOSOL_MINT.json

cd -

# MARINADE_PROGRAM_DATA=$(npx ts-node test-genesis/get-program-data.ts $MARINADE_PROGRAM)
# solana account -u m $MARINADE_PROGRAM_DATA -o test-genesis/generated-data/marinade.so 
# ls -l generated-data

npx ts-node take-test-mint-auth.ts $MSOL_MINT
npx ts-node take-test-mint-auth.ts $JITOSOL_MINT
