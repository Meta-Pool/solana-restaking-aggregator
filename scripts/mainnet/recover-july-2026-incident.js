const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const anchor = require('@coral-xyz/anchor');

const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = anchor.web3;

const PROGRAM_ID = new PublicKey('MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW');
const ADMIN = new PublicKey('MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ');
const MAIN_STATE = new PublicKey('mpsoLeuCF3LwrJWbzxNd81xRafePFfPhsNvGsAMhUAA');
const MSOL_MINT = new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');
const MSOL_VAULT = new PublicKey('5LsQaaarGCUcpB5rSL1DN9kH1ibQ99EKk4NPEvwxQtDq');
const MPSOL_MINT = new PublicKey('mPsoLV53uAGXnPJw63W91t2VDqCVZcU5rTh3PWzxnLr');
const TREASURY = new PublicKey('Gde12qXKF3fALWTAQgzyqBhNE67eBxdmJDLw3EiTu4eu');
const TICKET_ONE = new PublicKey('GGkyi3GBfdhFrzMeJ1rq79U8sx9GdsET9R3enaFJYrjd');
const TICKET_TWO = new PublicKey('A3u1ozkcuCeA8fSy67Q3SPM6shZxkq7bgTmHcNNCrRmt');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const EXPECTED_BEFORE = {
  backingSolValue: '1850876467964836',
  outstandingTicketsSolValue: '1987789388349',
  vaultTotalLstAmount: '1326150206353955',
  inStrategiesAmount: '1325992165887336',
  lstSolPriceP32: '5997869740',
  mintSupply: '1169912964281',
  treasuryAmount: '306973238762',
  ticketOneValue: '2613335346',
  ticketTwoValue: '1580481324637',
};

const EXPECTED_AFTER = {
  backingSolValue: '1060687409945',
  outstandingTicketsSolValue: '407082071130',
  vaultTotalLstAmount: '398279080525',
  inStrategiesAmount: '240238613906',
  lstSolPriceP32: '5997869740',
  mintSupply: '887703884309',
  treasuryAmount: '24764158790',
  ticketOneValue: '1193671382',
  ticketTwoValue: '1193671382',
};

function loadAdmin() {
  const keypairPath = path.join(
    process.env.HOME,
    '.config',
    'solana',
    'MP5o14fjGUU6G562tivBsvUBohqFxiczbWGHrwXDEyQ.json',
  );
  const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf8'))));
  if (!keypair.publicKey.equals(ADMIN)) {
    throw new Error(`Unexpected admin keypair ${keypair.publicKey.toBase58()}`);
  }
  return keypair;
}

function loadRpcUrl() {
  return fs.readFileSync(
    path.join(process.env.HOME, '.config', 'solana', 'be-rpcpool-token-url'),
    'utf8',
  ).trim();
}

function loadCoder() {
  const idlPath = path.resolve(
    __dirname,
    '../../../mp-sol-bot/src/res/mp_sol_restaking.json',
  );
  return new anchor.BorshAccountsCoder(JSON.parse(fs.readFileSync(idlPath, 'utf8')));
}

function tokenAmount(accountInfo) {
  return accountInfo.data.readBigUInt64LE(64).toString();
}

async function readState(connection, coder) {
  const addresses = [MAIN_STATE, MSOL_VAULT, MPSOL_MINT, TREASURY, TICKET_ONE, TICKET_TWO];
  const response = await connection.getMultipleAccountsInfoAndContext(addresses, 'confirmed');
  if (response.value.some(accountInfo => accountInfo === null)) {
    throw new Error('One or more recovery accounts do not exist');
  }
  const [mainInfo, vaultInfo, mintInfo, treasuryInfo, ticketOneInfo, ticketTwoInfo] = response.value;
  const main = coder.decode('MainVaultState', mainInfo.data);
  const vault = coder.decode('SecondaryVaultState', vaultInfo.data);
  const ticketOne = coder.decode('UnstakeTicket', ticketOneInfo.data);
  const ticketTwo = coder.decode('UnstakeTicket', ticketTwoInfo.data);

  return {
    slot: response.context.slot,
    backingSolValue: main.backing_sol_value.toString(),
    outstandingTicketsSolValue: main.outstanding_tickets_sol_value.toString(),
    vaultTotalLstAmount: vault.vault_total_lst_amount.toString(),
    inStrategiesAmount: vault.in_strategies_amount.toString(),
    lstSolPriceP32: vault.lst_sol_price_p32.toString(),
    mintSupply: mintInfo.data.readBigUInt64LE(36).toString(),
    treasuryAmount: tokenAmount(treasuryInfo),
    ticketOneValue: ticketOne.ticket_sol_value.toString(),
    ticketTwoValue: ticketTwo.ticket_sol_value.toString(),
  };
}

function assertState(actual, expected, label) {
  for (const [field, value] of Object.entries(expected)) {
    if (actual[field] !== value) {
      throw new Error(`${label} ${field}: expected ${value}, got ${actual[field]}`);
    }
  }
}

function recoveryInstruction() {
  const discriminator = crypto
    .createHash('sha256')
    .update('global:recover_july_2026_incident')
    .digest()
    .subarray(0, 8);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    data: discriminator,
    keys: [
      { pubkey: ADMIN, isSigner: true, isWritable: true },
      { pubkey: MAIN_STATE, isSigner: false, isWritable: true },
      { pubkey: MSOL_MINT, isSigner: false, isWritable: false },
      { pubkey: MSOL_VAULT, isSigner: false, isWritable: true },
      { pubkey: MPSOL_MINT, isSigner: false, isWritable: true },
      { pubkey: TREASURY, isSigner: false, isWritable: true },
      { pubkey: TICKET_ONE, isSigner: false, isWritable: true },
      { pubkey: TICKET_TWO, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
    ],
  });
}

async function main() {
  const send = process.argv.includes('--send');
  const connection = new Connection(loadRpcUrl(), 'confirmed');
  const admin = loadAdmin();
  const coder = loadCoder();

  const before = await readState(connection, coder);
  console.log('before', JSON.stringify(before, null, 2));
  assertState(before, EXPECTED_BEFORE, 'preflight');

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({
    feePayer: admin.publicKey,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }).add(recoveryInstruction());
  transaction.sign(admin);

  const simulation = await connection.simulateTransaction(transaction, [admin]);
  console.log('simulation logs', simulation.value.logs);
  if (simulation.value.err) {
    throw new Error(`Recovery simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  if (!send) {
    console.log('Simulation succeeded. Re-run with --send only after the patched program is deployed.');
    return;
  }

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    preflightCommitment: 'confirmed',
    skipPreflight: false,
  });
  const confirmation = await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    'confirmed',
  );
  if (confirmation.value.err) {
    throw new Error(`Recovery transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  const after = await readState(connection, coder);
  console.log('signature', signature);
  console.log('after', JSON.stringify(after, null, 2));
  assertState(after, EXPECTED_AFTER, 'post-recovery');
  console.log('Recovery confirmed and all postconditions verified.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
