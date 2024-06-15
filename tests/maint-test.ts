import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MpSolRestaking } from "../target/types/mp_sol_restaking";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as splStakePool from "@solana/spl-stake-pool";
// @ts-ignore: marinade-sdk has @coral-xyz/anchor and an older version of @solana/spl-token -- vscode intellisense gets confused
import { NATIVE_MINT, TOKEN_PROGRAM_ID, Token, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";

import { Marinade, MarinadeConfig, Provider } from '@marinade.finance/marinade-ts-sdk'

import { expect } from 'chai';
import { BN } from "bn.js";
import { createAta, getTokenAccountBalance, getTokenMintSupply, mintTokens, sendTx } from "./util/spl-token-mint-helpers";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import { AllInstructions } from "@coral-xyz/anchor/dist/cjs/program/namespace/types";
import { createMintToInstruction } from "@solana/spl-token";
import { createSyncNativeInstruction } from "@solana/spl-token";

const ONE_E9: string = 1e9.toFixed()
const TWO_POW_32: string = (2 ** 32).toFixed()

const WSOL_TOKEN_MINT = NATIVE_MINT.toBase58()

const MARINADE_MSOL_MINT = "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So";
const MARINADE_POOL_PROGRAM = "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD";
const MARINADE_STATE_ADDRESS = "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC";

const SPL_STAKE_POOL_PROGRAM = "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"
const JITO_SOL_TOKEN_MINT = "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"
const JITO_SOL_SPL_STAKE_POOL_STATE_ADDRESS = "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"

anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.MpSolRestaking as Program<MpSolRestaking>;
const provider = program.provider as anchor.AnchorProvider;
const wallet = provider.wallet;

const stakeEventListenerNumber = program.addEventListener("stakeEvent", stakeEventHandler)

const mainStateKeyPair = Keypair.generate()
const mpsolTokenMintKeyPair = Keypair.generate()

const operatorAuthKeyPair = Keypair.generate()
const strategyRebalancerAuthKeyPair = Keypair.generate()

const depositorUserKeyPair = Keypair.generate()

// monkey-patch BN so it shows decimal numbers on JSON stringify
BN.prototype.toJSON = function () { return this.toString() }

function stakeEventHandler(stakeEvent, slot, signature) {
  console.log("--- StakeEvent")
  console.log(JSON.stringify(stakeEvent, undefined, 4))
}

function idlConstant(idl: anchor.Idl, name: string) {
  try {
    return JSON.parse(idl.constants.find(c => c.name == name).value)
  } catch (ex) {
    throw new Error(`idlConstant("${name}"): ${ex}`)
  }
}

// format a price string with 32-bit precision to a 9 decimal places decimal number
function formatPrice32p(priceString32p: string) {
  let with9DecimalPlaces = (BigInt(priceString32p) * BigInt(ONE_E9) / BigInt(TWO_POW_32)).toString()
  return `${with9DecimalPlaces.slice(0, -9)}.${with9DecimalPlaces.slice(-9)}`
}

async function airdropLamports(provider: Provider, pubkey: PublicKey, amountSol: number = 10) {
  // airdrop some test lamports
  const latestBlockHash = await provider.connection.getLatestBlockhash();
  let token_airdrop_tx_hash = await provider.connection.requestAirdrop(pubkey, amountSol * 1e9);
  await provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: token_airdrop_tx_hash,
  }
  );
}

//-------------------------------
/// returns vault state address
async function testCreateSecondaryVault(tokenName: string, lstMint: string): Promise<PublicKey> {
  // creating a secondary vault
  console.log(`creating ${tokenName} secondary vault, lstMint:${lstMint}`)
  let lstMintPublickey = new PublicKey(lstMint);
  const [vaultSecondaryStateAddress, wSolSecondaryStateBump] =
    PublicKey.findProgramAddressSync(
      [
        mainStateKeyPair.publicKey.toBuffer(),
        lstMintPublickey.toBuffer(),
      ],
      program.programId
    )

  const [vaultsTokenAtaPdaAuth, vaultsTokenAtaPdaBump] =
    PublicKey.findProgramAddressSync(
      [
        mainStateKeyPair.publicKey.toBuffer(),
        idlConstant(program.idl, "vaultsAtaAuthSeed")
      ],
      program.programId
    )

  const vaultTokenAccountAddress =
    getAssociatedTokenAddressSync(lstMintPublickey, vaultsTokenAtaPdaAuth, true);

  const tx2 = await program.methods.createSecondaryVault()
    .accounts({
      admin: wallet.publicKey,
      mainState: mainStateKeyPair.publicKey,
      lstMint: lstMintPublickey,
      secondaryState: vaultSecondaryStateAddress,
      vaultLstAccount: vaultTokenAccountAddress
    })
    .rpc();

  {
    const secondaryVaultState = await program.account.secondaryVaultState.fetch(vaultSecondaryStateAddress);
    // console.log(secondaryVaultState)
    expect(secondaryVaultState.depositsDisabled).to.eql(true);
    expect(secondaryVaultState.inStrategiesAmount.toString()).to.eql("0");
    expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql("0");
    expect(secondaryVaultState.lstMint).to.eql(lstMintPublickey);
    expect(secondaryVaultState.lstSolPriceP32.toString()).to.eql("0");
    expect(secondaryVaultState.ticketsTargetSolAmount.toString()).to.eql("0");
    expect(secondaryVaultState.vaultTotalLstAmount.toString()).to.eql("0");
  }

  return vaultSecondaryStateAddress
}

//-------------------------------
/// returns vault state contents
function testGetUpdateVaultPriceMethod(tokenName: string, lstMint: string) {
  // -----------------------
  console.log(`update ${tokenName} vault token price, lstMint:${lstMint}`)
  return program.methods.updateVaultTokenSolPrice()
    .accounts({
      mainState: mainStateKeyPair.publicKey,
      lstMint: lstMint,
    })
    .remainingAccounts([])
}

//-------------------------
// creates a unstake ticket
async function testCreate1e10UnstakeTicket(depositorMpSolAta: PublicKey, expectWaitHours: number): Promise<Keypair> {
  // remember main state
  const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
  const preMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))

  // give some lamports to depositor to pay for the ticket-account
  await airdropLamports(provider, depositorUserKeyPair.publicKey);

  // account to store the unstake-ticket
  let newTicketKeyPair = new Keypair()

  // create ix to deposit the mSOL in the vault
  let amountMpsolUnstaked = new BN(1e10.toFixed())
  let unstakeTx = program.methods
    .unstake(amountMpsolUnstaked)
    .accounts({
      mainState: mainStateKeyPair.publicKey,
      unstaker: depositorUserKeyPair.publicKey,
      mpsolMint: mpsolTokenMintKeyPair.publicKey,
      unstakerMpsolAccount: depositorMpSolAta,
      newTicketAccount: newTicketKeyPair.publicKey,
    })

  // uncomment to show tx simulation program log
  // {
  //   console.log("stakeTx.simulate() -- no signers")
  //   try {
  //     let result = await unstakeTx.simulate()
  //     console.log(result)
  //   }
  // catch (ex)   {
  //     console.log("exception",ex)
  //   }
  // }

  {
    console.log("unstakeTx.signers().rpc()")
    let result = await unstakeTx
      .signers([depositorUserKeyPair, newTicketKeyPair])
      .rpc()
  }

  // check after unstake

  // check ticket AccountInfo
  const ticketAccountInfo = await provider.connection.getAccountInfo(newTicketKeyPair.publicKey);
  expect(ticketAccountInfo.owner.toBase58()).to.be.eq(program.programId.toBase58())
  // check ticket AccountData
  const ticket = await program.account.unstakeTicket.fetch(newTicketKeyPair.publicKey);
  expect(ticket.beneficiary.toBase58()).to.be.eq(depositorUserKeyPair.publicKey.toBase58());
  expect(ticket.mainState.toBase58()).to.be.eq(mainStateKeyPair.publicKey.toBase58());
  const nowTimestamp = new Date().getTime() / 1000
  // console.log("nowTimestamp",nowTimestamp, "expectWaitHours",expectWaitHours)
  // console.log("ticket.ticketDueTimestamp", ticket.ticketDueTimestamp.toNumber())
  const expectedDueDate = nowTimestamp + expectWaitHours * 60 * 60
  expect(ticket.ticketDueTimestamp.toNumber()).to.be.greaterThan(expectedDueDate - 10).and.lessThan(expectedDueDate + 10);

  // check main state after
  const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
  expect(mainStatePre.backingSolValue.sub(ticket.ticketSolValue).toString()).to.eql(mainStateAfter.backingSolValue.toString());

  // check mpSOL mint after
  const postMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
  expect(preMpSolMintSupply.sub(amountMpsolUnstaked).toString()).to.eql(postMpSolMintSupply.toString());

  // test ticket claim
  return newTicketKeyPair
}



// ------------------------------
describe("mp-sol-restaking", () => {

  it("main path testing", async () => {

    // ----------------------
    // initialize main state
    // ----------------------
    {
      const tx = await program.methods.initialize(
        operatorAuthKeyPair.publicKey, strategyRebalancerAuthKeyPair.publicKey
      )
        .accounts({
          admin: wallet.publicKey,
          mainState: mainStateKeyPair.publicKey,
          mpsolTokenMint: mpsolTokenMintKeyPair.publicKey,
        })
        .signers([mainStateKeyPair, mpsolTokenMintKeyPair]) // note: provider.wallet is automatically included as payer
        .rpc();
      //console.log("Your transaction signature", tx);
    }

    // check main state
    const mainState = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
    expect(mainState.admin).to.eql(wallet.publicKey);
    expect(mainState.mpsolMint).to.eql(mpsolTokenMintKeyPair.publicKey);
    expect(mainState.operatorAuth).to.eql(operatorAuthKeyPair.publicKey);
    expect(mainState.strategyRebalancerAuth).to.eql(strategyRebalancerAuthKeyPair.publicKey);

    const [mainVaultMintAuth, mainVaultMintAuthBump] =
      PublicKey.findProgramAddressSync(
        [
          mainStateKeyPair.publicKey.toBuffer(),
          idlConstant(program.idl, "mainVaultMintAuthSeed")
        ],
        program.programId
      )

    const decodedMint = await getMint(provider.connection, mpsolTokenMintKeyPair.publicKey)
    expect(decodedMint.decimals).to.eql(9);
    expect(decodedMint.mintAuthority).to.eql(mainVaultMintAuth);
    expect(decodedMint.freezeAuthority).to.eql(mainVaultMintAuth);

    // create depositor mpsol ATA account
    let depositorMpSolAta = await createAta(provider, wallet, mpsolTokenMintKeyPair.publicKey, depositorUserKeyPair.publicKey)

    // compute common PDAs
    const [vaultAtaAuth, vaultAtaAuthBump] = PublicKey.findProgramAddressSync(
      [mainStateKeyPair.publicKey.toBuffer(), idlConstant(program.idl, "vaultsAtaAuthSeed")]
      , program.programId);

    // ------------------------------
    // create wSOL secondary vault
    // ------------------------------
    let wSolSecondaryStateAddress =
      await testCreateSecondaryVault("wSOL", WSOL_TOKEN_MINT);

    let amountWsolDeposited = new BN(1e11.toFixed())
    //let depositorAtaWSol = await mintTokens(provider, wallet, new PublicKey(WSOL_TOKEN_MINT), depositorUserKeyPair.publicKey, amountWsolDeposited.toNumber());
    let depositorAtaWSol = await createAta(provider, wallet, new PublicKey(WSOL_TOKEN_MINT), depositorUserKeyPair.publicKey)
    let instructions = [
      // transfer SOL to ATA then convert to wSOL balance
      anchor.web3.SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: depositorAtaWSol,
        lamports: amountWsolDeposited.toNumber() + 1e9,
      }),
      // sync wrapped SOL balance
      createSyncNativeInstruction(depositorAtaWSol)
    ];
    await sendTx(provider, wallet, instructions)

    // test wSOL update price (simple, always 1)
    {
      const method = testGetUpdateVaultPriceMethod("wSOL", WSOL_TOKEN_MINT);
      await method.rpc();
      let wSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(wSolSecondaryStateAddress)
      expect(wSolSecondaryVaultState.lstSolPriceTimestamp.toNumber()).to.greaterThanOrEqual(new Date().getTime() / 1000 - 2);
      expect(wSolSecondaryVaultState.lstSolPriceP32.toString()).to.eql(TWO_POW_32);
    }

    console.log("test wSOL deposit")
    {
      // enable deposits in Wsol vault
      await program.methods.configureSecondaryVault({ depositsDisabled: false })
        .accounts({
          admin: wallet.publicKey,
          mainState: mainStateKeyPair.publicKey,
          lstMint: new PublicKey(WSOL_TOKEN_MINT),
        })
        .rpc()

      const vaultWSolAta = await getAssociatedTokenAddressSync(
        new PublicKey(WSOL_TOKEN_MINT), vaultAtaAuth, true);

      let stakeTx = await program.methods
        .stake(amountWsolDeposited)
        .accounts({
          mainState: mainStateKeyPair.publicKey,
          lstMint: new PublicKey(WSOL_TOKEN_MINT),
          vaultLstAccount: vaultWSolAta,
          depositor: depositorUserKeyPair.publicKey,
          depositorLstAccount: depositorAtaWSol,
          mpsolMint: mpsolTokenMintKeyPair.publicKey,
          depositorMpsolAccount: depositorMpSolAta,
        })
        
      try {
        await stakeTx.simulate()
      } catch (ex) {
        console.error(ex)
        throw(ex)
      }
      await stakeTx.signers([depositorUserKeyPair]).rpc()
    }

    // ------------------------------
    // stake SOL and get some mSOL --- NOPE: we need to clone all marinade state accounts for this to work
    // we will just hijack mSOL mint in the test-validator and mint mSOL to test deposits
    // ------------------------------
    // let depositResult = await marinade.deposit(new BN(1e15.toFixed()));
    // walletMsolAccount = depositResult.associatedMSolTokenAccountAddress;
    // let stakeMsolTx = new Transaction( await provider.connection.getLatestBlockhash());
    // stakeMsolTx.feePayer = wallet.publicKey
    // stakeMsolTx.add(depositResult.transaction)
    // stakeMsolTx = await wallet.signTransaction(stakeMsolTx)
    // await provider.sendAndConfirm(stakeMsolTx);

    // ------------------------------
    // mint some mSOL with the hijacked mint
    // ------------------------------
    console.log("mint mSOL & jitoSOL to test stake")
    let depositorAtaMsol = await mintTokens(provider, wallet, new PublicKey(MARINADE_MSOL_MINT), depositorUserKeyPair.publicKey, 1e15)
    let depositorAtaJitoSol = await mintTokens(provider, wallet, new PublicKey(JITO_SOL_TOKEN_MINT), depositorUserKeyPair.publicKey, 1e12)
    // ------------------------------

    // compute PDAs
    const vaultMsolAta = await getAssociatedTokenAddressSync(
      new PublicKey(MARINADE_MSOL_MINT), vaultAtaAuth, true);

    // ------------------------------
    // create Marinade mSol secondary vault
    // ------------------------------
    let marinadeSecondaryVaultStateAddress =
      await testCreateSecondaryVault("mSOL", MARINADE_MSOL_MINT
      );

    // test mSOL secondary vault update price
    let walletMsolAccount;
    {
      let marinadeStatePubKey = new PublicKey(MARINADE_STATE_ADDRESS)
      // first get mSOL price by using @@marinade.finance/marinade-ts-sdk
      const config = new MarinadeConfig({
        connection: provider.connection,
        publicKey: wallet.publicKey
      })
      const marinade = new Marinade(config)
      let poolInfoViaSdk = await marinade.getMarinadeState()
      splStakePool.stakePoolInfo(provider.connection, marinadeStatePubKey)
      console.log("mSOL price from sdk:", poolInfoViaSdk.mSolPrice)
      const sdkComputedPrice32p = BigInt((poolInfoViaSdk.mSolPrice * Number(TWO_POW_32)).toFixed())

      {
        // 2nd call UpdateVaultPriceMethod for marinadeSecondaryVaultStateAddress
        const method = testGetUpdateVaultPriceMethod("mSOL", MARINADE_MSOL_MINT)
        const withRemainingAccounts = method.remainingAccounts([{
          pubkey: marinadeStatePubKey, isSigner: false, isWritable: false
        }]);

        // Debug: simulate and show log
        // let result = await withRemainingAccounts.simulate();
        // console.log(result);

        // execute the call
        let tx = await withRemainingAccounts.rpc();
        let mSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress)

        // compare price results
        console.log("price from vault", formatPrice32p(mSolSecondaryVaultState.lstSolPriceP32.toString()))
        expect(mSolSecondaryVaultState.lstSolPriceTimestamp.toNumber()).to.greaterThanOrEqual(new Date().getTime() / 1000 - 2);
        expect(mSolSecondaryVaultState.lstSolPriceP32.toString()).to.eql(sdkComputedPrice32p.toString());
      }

      // remember main state
      const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
      const preMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
      const prevMpSolBalance = new BN(await getTokenAccountBalance(provider, depositorMpSolAta));

      // create ix to deposit the mSOL in the vault
      let amountMsolDeposited = new BN(1e12.toFixed())
      let stakeTx = await program.methods
        .stake(amountMsolDeposited)
        .accounts({
          mainState: mainStateKeyPair.publicKey,
          lstMint: new PublicKey(MARINADE_MSOL_MINT),
          vaultLstAccount: vaultMsolAta,
          vaultState: marinadeSecondaryVaultStateAddress,
          depositor: depositorUserKeyPair.publicKey,
          depositorLstAccount: depositorAtaMsol,
          mpsolMint: mpsolTokenMintKeyPair.publicKey,
          depositorMpsolAccount: depositorMpSolAta,
        })
        .remainingAccounts(
          [{
            pubkey: new PublicKey(MARINADE_STATE_ADDRESS), isSigner: false, isWritable: false
          }]);

      //console.log(stakeTx)

      // -------------------
      // start staking tries
      // -------------------
      try {
        console.log("stakeTx.simulate()")
        await stakeTx.simulate()
        expect(false, "stakeTx.rpc() should throw");
      }
      catch (ex) {
        // console.log("simulate throw ex:", ex)
        expect(JSON.stringify(ex)).to.contain("DepositsInThisVaultAreDisabled")
      }

      {
        console.log("config, enable deposits")
        let configTx = await program.methods.configureSecondaryVault({ depositsDisabled: false })
          .accounts({
            admin: wallet.publicKey,
            mainState: mainStateKeyPair.publicKey,
            lstMint: new PublicKey(MARINADE_MSOL_MINT),
          })
          .rpc()
      }

      // // uncomment to show tx simulation program log
      // {
      //   console.log("stakeTx.simulate() -- no signers")
      //   try {
      //     let result = await stakeTx.simulate()
      //     console.log(result)
      //   }
      //   catch (ex) {
      //     console.log(ex)
      //   }
      // }

      {
        console.log("stakeTx.signers().rpc()")
        let result = await stakeTx
          .signers([depositorUserKeyPair])
          .rpc()
      }

      // check received mpSOL amount
      let mSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress)
      const solValueDeposited = amountMsolDeposited.mul(mSolSecondaryVaultState.lstSolPriceP32).div(new BN(TWO_POW_32));
      const correspondingMpSolAmount = preMpSolMintSupply.isZero() ? solValueDeposited :
        solValueDeposited.mul(preMpSolMintSupply).div(mainStatePre.backingSolValue);
      let postMpSolBalance = new BN(await getTokenAccountBalance(provider, depositorMpSolAta))
      let mpSolReceived = postMpSolBalance.sub(prevMpSolBalance);
        expect(mpSolReceived.toString()).to.eql(correspondingMpSolAmount.toString());

      // check secondary vault state after stake
      const secondaryVaultState = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress);
      expect(secondaryVaultState.depositsDisabled).to.eql(false);
      expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql(amountMsolDeposited.toString());
      expect(secondaryVaultState.vaultTotalLstAmount.toString()).to.eql(amountMsolDeposited.toString());

      // check main state after
      const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
      expect(mainStatePre.backingSolValue.add(solValueDeposited).toString()).to.eql(mainStateAfter.backingSolValue.toString());

      // check mpSOL mint after
      const postMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
      expect(preMpSolMintSupply.add(mpSolReceived).toString()).to.eql(postMpSolMintSupply.toString());

    }

    // ------------------------------
    // create JitoSOL secondary vault
    // ------------------------------
    let jitoSolSecondaryVaultStateAddress =
      await testCreateSecondaryVault("JitoSOL", JITO_SOL_TOKEN_MINT
      );

    // test SPl-stake-pool update price (using jitoSOL SPL-stake-pool as example)
    {
      let jitoSolSplStakePoolStatePubKey = new PublicKey(JITO_SOL_SPL_STAKE_POOL_STATE_ADDRESS)
      // first get jitoSOL price by using @solana/spl-stake-pool SDK
      let poolInfoViaSdk = await splStakePool.stakePoolInfo(provider.connection, jitoSolSplStakePoolStatePubKey)
      const sdkComputedPrice = BigInt(poolInfoViaSdk.totalLamports) * BigInt(TWO_POW_32) / BigInt(poolInfoViaSdk.poolTokenSupply);
      console.log("jitoSOL price via SDK", formatPrice32p(sdkComputedPrice.toString()))

      // 2nd call UpdateVaultPriceMethod for jitoSolSecondaryVaultStateAddress
      const method = testGetUpdateVaultPriceMethod("jitoSOL", JITO_SOL_TOKEN_MINT)
      const withRemainingAccounts = method.remainingAccounts([{
        pubkey: jitoSolSplStakePoolStatePubKey, isSigner: false, isWritable: false
      }]);

      // Debug: simulate and show log
      // let result = await withRemainingAccounts.simulate();
      // console.log(result);

      // execute the call
      let tx = await withRemainingAccounts.rpc();
      let jitoSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(jitoSolSecondaryVaultStateAddress)

      // compare price results
      console.log("jitoSOL price from vault:", formatPrice32p(jitoSolSecondaryVaultState.lstSolPriceP32.toString()))
      expect(jitoSolSecondaryVaultState.lstSolPriceTimestamp.toNumber()).to.greaterThanOrEqual(new Date().getTime() / 1000 - 2);
      expect(jitoSolSecondaryVaultState.lstSolPriceP32.toString()).to.eql(sdkComputedPrice.toString());

      // stake jito-SOL
      {

        // remember main state
        const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        const preMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
        const prevMpSolBalance = new BN(await getTokenAccountBalance(provider, depositorMpSolAta));

        {
          console.log("config, enable deposits for JITO_SOL_TOKEN_MINT")
          let configTx = await program.methods.configureSecondaryVault({ depositsDisabled: false })
            .accounts({
              admin: wallet.publicKey,
              mainState: mainStateKeyPair.publicKey,
              lstMint: new PublicKey(JITO_SOL_TOKEN_MINT),
            })
            .rpc()
        }

        const vaultJitoSolAta = await getAssociatedTokenAddressSync(
          new PublicKey(JITO_SOL_TOKEN_MINT), vaultAtaAuth, true);

        let amountJitoSolDeposited = new BN(1e11.toFixed())
        let stakeTx = await program.methods
          .stake(amountJitoSolDeposited)
          .accounts({
            mainState: mainStateKeyPair.publicKey,
            lstMint: new PublicKey(JITO_SOL_TOKEN_MINT),
            vaultState: jitoSolSecondaryVaultStateAddress,
            vaultLstAccount: vaultJitoSolAta,
            depositor: depositorUserKeyPair.publicKey,
            depositorLstAccount: depositorAtaJitoSol,
            mpsolMint: mpsolTokenMintKeyPair.publicKey,
            depositorMpsolAccount: depositorMpSolAta,
          })
          .remainingAccounts(
            [{
              pubkey: new PublicKey(JITO_SOL_SPL_STAKE_POOL_STATE_ADDRESS), isSigner: false, isWritable: false
            }]);

        // uncomment to show tx simulation program log
        // {
        //   console.log("stakeTx.simulate() -- no signers")
        //   try {
        //     let result = await stakeTx.simulate()
        //     console.log(result)
        //   }
        //   catch (ex) {
        //     console.log(ex)
        //   }
        // }

        {
          console.log("stakeTx.signers().rpc()")
          let result = await stakeTx
            .signers([depositorUserKeyPair])
            .rpc()
        }

        // check received mpSOL amount
        const solValueDeposited = amountJitoSolDeposited.mul(jitoSolSecondaryVaultState.lstSolPriceP32).div(new BN(TWO_POW_32));
        const correspondingMpSolAmount = preMpSolMintSupply.isZero() ? solValueDeposited :
          solValueDeposited.mul(preMpSolMintSupply).div(mainStatePre.backingSolValue);
        let postMpSolBalance = new BN(await getTokenAccountBalance(provider, depositorMpSolAta))
        let mpSolReceived = postMpSolBalance.sub(prevMpSolBalance);
        expect(mpSolReceived.toString()).to.eql(correspondingMpSolAmount.toString());

        // check secondary vault state after stake
        const secondaryVaultState = await program.account.secondaryVaultState.fetch(jitoSolSecondaryVaultStateAddress);
        expect(secondaryVaultState.depositsDisabled).to.eql(false);
        expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql(amountJitoSolDeposited.toString());
        expect(secondaryVaultState.vaultTotalLstAmount.toString()).to.eql(amountJitoSolDeposited.toString());

        // check main state after
        const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        expect(mainStatePre.backingSolValue.add(solValueDeposited).toString()).to.eql(mainStateAfter.backingSolValue.toString());

        // check mpSOL mint after
        const postMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
        expect(preMpSolMintSupply.add(mpSolReceived).toString()).to.eql(postMpSolMintSupply.toString());

      }

    }

    {
      // test unstake, with the default 48hs wait time
      let newTicketAccount1 = await testCreate1e10UnstakeTicket(depositorMpSolAta, 48);
    }

    // test unstake & claim
    {
      // config for 0hs waiting time
      {
        console.log("config, 0hs wait time")
        let configTx = await program.methods.configureMainVault({
          unstakeTicketWaitingHours: 0,
          treasuryMpsolAccount: null, // null => None => No change
          performanceFeeBp: null, // null => None => No change
        }
        ).accounts({
          admin: wallet.publicKey,
          mainState: mainStateKeyPair.publicKey,
        })

        // // uncomment to show tx simulation program log
        // {
        //   console.log("configureMainVault.simulate()")
        //   try {
        //     let result = await configTx.simulate()
        //     console.log(result)
        //   }
        //   catch (ex) {
        //     console.log(ex)
        //   }
        // }

        // execute
        await configTx.rpc()
      }
      // create the ticket
      const newTicketAccount2 = await testCreate1e10UnstakeTicket(depositorMpSolAta, 0);
      const amountSolTicket = new BN(1e10.toFixed())

      // claim 1/3
      {
        // remember pre data before claim
        const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        // console.log("mainStatePre.outstandingTicketsSolValue",mainStatePre.outstandingTicketsSolValue.toString());
        expect(mainStatePre.unstakeTicketWaitingHours).to.be.eq(0);
        const userMsolAccountBalancePre = await getTokenAccountBalance(provider, depositorAtaMsol);
        const mSolSecondaryVaultStatePre = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress)
        const ticketAccountPre = await program.account.unstakeTicket.fetch(newTicketAccount2.publicKey);

        let amountSolClaimed = amountSolTicket.div(new BN(3))
        console.log("ticket claim 1/3", amountSolClaimed.toString())
        let claimTx = await program.methods.ticketClaim(amountSolClaimed)
          .accounts({
            mainState: mainStateKeyPair.publicKey,
            beneficiary: depositorUserKeyPair.publicKey,
            ticketAccount: newTicketAccount2.publicKey,
            lstMint: new PublicKey(MARINADE_MSOL_MINT),
            beneficiaryLstAccount: depositorAtaMsol,
            vaultLstAccount: vaultMsolAta
          })
          .remainingAccounts([{
            pubkey: new PublicKey(MARINADE_STATE_ADDRESS), isSigner: false, isWritable: false
          }])

        // // uncomment to show tx simulation program log
        // {
        //   console.log("simulate()")
        //   try {
        //     let result = await claimTx.simulate()
        //     console.log(result)
        //   }
        //   catch (ex) {
        //     console.log(ex)
        //   }
        // }

        // execute 
        await claimTx
          .signers([depositorUserKeyPair])
          .rpc()

        // check received mSOL amount
        let userMsolAccountBalancePost = await getTokenAccountBalance(provider, depositorAtaMsol);
        let amountMsolReceived = new BN(userMsolAccountBalancePost).sub(new BN(userMsolAccountBalancePre))
        // compute sol-value received
        const computedSolValueReceived = amountMsolReceived.mul(mSolSecondaryVaultStatePre.lstSolPriceP32).div(new BN(TWO_POW_32));
        console.log("computedSolValueReceived", computedSolValueReceived.toString())
        // allow for 1 lamport difference
        expect(amountSolClaimed.toNumber()).to.be.greaterThan(computedSolValueReceived.subn(1).toNumber())
          .and.to.be.lessThanOrEqual(computedSolValueReceived.addn(1).toNumber());

        // check secondary vault state after claim
        const secondaryVaultStatePost = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress);
        expect(secondaryVaultStatePost.locallyStoredAmount.toString())
          .to.eql(mSolSecondaryVaultStatePre.locallyStoredAmount.sub(amountMsolReceived).toString());
        expect(secondaryVaultStatePost.vaultTotalLstAmount.toString())
          .to.eql(mSolSecondaryVaultStatePre.vaultTotalLstAmount.sub(amountMsolReceived).toString());
        if (secondaryVaultStatePost.ticketsTargetSolAmount.toNumber() > 0) {
          expect(secondaryVaultStatePost.ticketsTargetSolAmount.toString())
            .to.be.eq(mSolSecondaryVaultStatePre.ticketsTargetSolAmount.sub(computedSolValueReceived).toString());
        }

        // check main state after
        const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        // console.log("mainStateAfter.outstandingTicketsSolValue",mainStateAfter.outstandingTicketsSolValue.toString());
        expect(mainStateAfter.outstandingTicketsSolValue.toString())
          .to.eql(mainStatePre.outstandingTicketsSolValue.sub(amountSolClaimed).toString());

        // check ticket account after
        const ticketAccountAfter = await program.account.unstakeTicket.fetch(newTicketAccount2.publicKey);
        expect(ticketAccountAfter.ticketSolValue.toString())
          .to.eql(ticketAccountPre.ticketSolValue.sub(amountSolClaimed).toString());
      }

      // claim the rest
      {
        // remember pre data before claim
        const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        const userMsolAccountBalancePre = await getTokenAccountBalance(provider, depositorAtaMsol);
        const mSolSecondaryVaultStatePre = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress)
        const ticketAccountPre = await program.account.unstakeTicket.fetch(newTicketAccount2.publicKey);

        let amountSolClaimed = amountSolTicket.sub(amountSolTicket.div(new BN(3)))
        console.log("ticket claim rest", amountSolClaimed.toString())
        let claimTx = await program.methods.ticketClaim(amountSolClaimed)
          .accounts({
            mainState: mainStateKeyPair.publicKey,
            beneficiary: depositorUserKeyPair.publicKey,
            ticketAccount: newTicketAccount2.publicKey,
            lstMint: new PublicKey(MARINADE_MSOL_MINT),
            beneficiaryLstAccount: depositorAtaMsol,
            vaultLstAccount: vaultMsolAta
          })
          .remainingAccounts([{
            pubkey: new PublicKey(MARINADE_STATE_ADDRESS), isSigner: false, isWritable: false
          }])

        // // uncomment to show tx simulation program log
        // {
        //   console.log("simulate()")
        //   try {
        //     let result = await claimTx.simulate()
        //     console.log(result)
        //   }
        //   catch (ex) {
        //     console.log(ex)
        //   }
        // }

        // execute 
        await claimTx
          .signers([depositorUserKeyPair])
          .rpc()

        // check received mSOL amount
        let userMsolAccountBalancePost = await getTokenAccountBalance(provider, depositorAtaMsol);
        let amountMsolReceived = new BN(userMsolAccountBalancePost).sub(new BN(userMsolAccountBalancePre))
        // compute sol-value received
        const computedSolValueReceived = amountMsolReceived.mul(mSolSecondaryVaultStatePre.lstSolPriceP32).div(new BN(TWO_POW_32));
        console.log("computedSolValueReceived", computedSolValueReceived.toString())
        // allow for 1 lamport difference
        expect(amountSolClaimed.toNumber()).to.be.greaterThan(computedSolValueReceived.subn(1).toNumber())
          .and.to.be.lessThanOrEqual(computedSolValueReceived.addn(1).toNumber());

        // check secondary vault state after claim
        const secondaryVaultStatePost = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress);
        expect(secondaryVaultStatePost.locallyStoredAmount.toString())
          .to.eql(mSolSecondaryVaultStatePre.locallyStoredAmount.sub(amountMsolReceived).toString());
        expect(secondaryVaultStatePost.vaultTotalLstAmount.toString())
          .to.eql(mSolSecondaryVaultStatePre.vaultTotalLstAmount.sub(amountMsolReceived).toString());
        if (secondaryVaultStatePost.ticketsTargetSolAmount.toNumber() > 0) {
          expect(secondaryVaultStatePost.ticketsTargetSolAmount.toString())
            .to.be.eq(mSolSecondaryVaultStatePre.ticketsTargetSolAmount.sub(computedSolValueReceived).toString());
        }

        // check main state after
        const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        // console.log("mainStateAfter.outstandingTicketsSolValue",mainStateAfter.outstandingTicketsSolValue.toString());
        expect(mainStateAfter.outstandingTicketsSolValue.toString())
          .to.eql(mainStatePre.outstandingTicketsSolValue.sub(amountSolClaimed).toString());

        // check ticket account after -- must have been deleted
        try {
          const ticketAccountAfter = await program.account.unstakeTicket.fetch(newTicketAccount2.publicKey);
        } catch (ex) {
          expect(ex.message).to.contain("Account does not exist or has no data")
        }
      }

    }

    after(() => {
      // remove listeners
      program.removeEventListener(stakeEventListenerNumber)
    })


  });

});


