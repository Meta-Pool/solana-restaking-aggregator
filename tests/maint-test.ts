import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MpSolRestaking } from "../target/types/mp_sol_restaking";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as splStakePool from "@solana/spl-stake-pool";
// @ts-ignore: marinade-sdk has @coral-xyz/anchor and an older version of @solana/spl-token -- vscode intellisense gets confused
import { NATIVE_MINT, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";

import { Marinade, MarinadeConfig, Provider } from '@marinade.finance/marinade-ts-sdk'

import { expect } from 'chai';
import { BN } from "bn.js";
import { createAta, getTokenAccountBalance, getTokenMintSupply, mintTokens } from "./util/spl-token-mint-helpers";

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

async function airdropLamports(provider:Provider, pubkey: PublicKey, amountSol: number = 10){
    // airdrop some test lamports
    const latestBlockHash = await provider.connection.getLatestBlockhash();      
    let token_airdrop_tx_hash = await provider.connection.requestAirdrop(pubkey, amountSol * 1e9);
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature:token_airdrop_tx_hash, }
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
    expect(secondaryVaultState.vaultTotalSolValue.toString()).to.eql("0");
    expect(secondaryVaultState.ticketsTargetSolAmount.toString()).to.eql("0");
    expect(secondaryVaultState.vaultLstAccount).to.eql(vaultTokenAccountAddress);
    expect(secondaryVaultState.vaultTotalLstAmount.toString()).to.eql("0");
    expect(secondaryVaultState.whitelistedStrategies.length.toString()).to.eql("0");
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
    expect(mainState.whitelistedVaults.length).to.eql(0);

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

    // ------------------------------
    // create wSOL secondary vault
    // ------------------------------
    let wSolSecondaryStateAddress =
      await testCreateSecondaryVault("wSOL", WSOL_TOKEN_MINT
      );

    // test wSOL update price (simple, always 1)
    {
      const method = testGetUpdateVaultPriceMethod("wSOL", WSOL_TOKEN_MINT);
      await method.rpc();
      let wSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(wSolSecondaryStateAddress)
      expect(wSolSecondaryVaultState.lstSolPriceTimestamp.toNumber()).to.greaterThanOrEqual(new Date().getTime() / 1000 - 2);
      expect(wSolSecondaryVaultState.lstSolPriceP32.toString()).to.eql(TWO_POW_32);
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

    let depositorMpSolAta = await createAta(provider, wallet, mpsolTokenMintKeyPair.publicKey, depositorUserKeyPair.publicKey)

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

      // create ix to deposit the mSOL in the vault
      let amountMsolDeposited = new BN(1e12.toFixed())
      let stakeTx = await program.methods
        .stake(amountMsolDeposited)
        .accounts({
          mainState: mainStateKeyPair.publicKey,
          lstMint: new PublicKey(MARINADE_MSOL_MINT),
          vaultState: marinadeSecondaryVaultStateAddress,
          depositor: depositorUserKeyPair.publicKey,
          depositorLstAccount: depositorAtaMsol,
          mpsolMint: mpsolTokenMintKeyPair.publicKey,
          depositorMpsolAccount: depositorMpSolAta,
        })
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
        //console.log("simulate throw ex:", ex)
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
      let mSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress)
      const solValueDeposited = amountMsolDeposited.mul(mSolSecondaryVaultState.lstSolPriceP32).div(new BN(TWO_POW_32));
      const correspondingMpSolAmount = preMpSolMintSupply.isZero() ? solValueDeposited :
        solValueDeposited.mul(preMpSolMintSupply).div(mainStatePre.backingSolValue);
      // a deposit fee applies
      const depositFeeMpSolAmount = correspondingMpSolAmount.mul(new BN(mainStatePre.depositFeeBp)).div(new BN("10000"));
      let mpSolReceived = new BN(await getTokenAccountBalance(provider, depositorMpSolAta));
      expect(mpSolReceived.toString()).to.eql(correspondingMpSolAmount.sub(depositFeeMpSolAmount).toString());

      // check secondary vault state after stake
      const secondaryVaultState = await program.account.secondaryVaultState.fetch(marinadeSecondaryVaultStateAddress);
      expect(secondaryVaultState.depositsDisabled).to.eql(false);
      expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql(amountMsolDeposited.toString());
      expect(secondaryVaultState.vaultTotalSolValue.toString()).to.eql(solValueDeposited.toString());

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

        let amountJitoSolDeposited = new BN(1e11.toFixed())
        let stakeTx = await program.methods
          .stake(amountJitoSolDeposited)
          .accounts({
            mainState: mainStateKeyPair.publicKey,
            lstMint: new PublicKey(JITO_SOL_TOKEN_MINT),
            vaultState: jitoSolSecondaryVaultStateAddress,
            depositor: depositorUserKeyPair.publicKey,
            depositorLstAccount: depositorAtaJitoSol,
            mpsolMint: mpsolTokenMintKeyPair.publicKey,
            depositorMpsolAccount: depositorMpSolAta,
          })

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
        // a deposit fee applies
        const depositFeeMpSolAmount = correspondingMpSolAmount.mul(new BN(mainStatePre.depositFeeBp)).div(new BN("10000"));
        let postMpSolBalance = new BN(await getTokenAccountBalance(provider, depositorMpSolAta))
        let mpSolReceived = postMpSolBalance.sub(prevMpSolBalance);
        expect(mpSolReceived.toString()).to.eql(correspondingMpSolAmount.sub(depositFeeMpSolAmount).toString());

        // check secondary vault state after stake
        const secondaryVaultState = await program.account.secondaryVaultState.fetch(jitoSolSecondaryVaultStateAddress);
        expect(secondaryVaultState.depositsDisabled).to.eql(false);
        expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql(amountJitoSolDeposited.toString());
        expect(secondaryVaultState.vaultTotalSolValue.toString()).to.eql(solValueDeposited.toString());

        // check main state after
        const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
        expect(mainStatePre.backingSolValue.add(solValueDeposited).toString()).to.eql(mainStateAfter.backingSolValue.toString());

        // check mpSOL mint after
        const postMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
        expect(preMpSolMintSupply.add(mpSolReceived).toString()).to.eql(postMpSolMintSupply.toString());

      }



    }

    // test unstake
    {
      // remember main state
      const mainStatePre = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
      const preMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))

      // give some lamports to depositor to pay for the ticket-account
      await airdropLamports(provider, depositorUserKeyPair.publicKey);

      // account to store the unstake-ticket
      let newTicketAccount = new Keypair()

      // create ix to deposit the mSOL in the vault
      let amountMpsolUnstaked = new BN(1e10.toFixed())
      let unstakeTx = await program.methods
        .unstake(amountMpsolUnstaked)
        .accounts({
          mainState: mainStateKeyPair.publicKey,
          unstaker: depositorUserKeyPair.publicKey,
          mpsolMint: mpsolTokenMintKeyPair.publicKey,
          unstakerMpsolAccount: depositorMpSolAta,
          newTicketAccount: newTicketAccount.publicKey,
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
          .signers([depositorUserKeyPair, newTicketAccount])
          .rpc()
      }

      // check after unstake
      
      // check ticket AccountInfo
      const ticketAccountInfo = await provider.connection.getAccountInfo(newTicketAccount.publicKey);
      expect(ticketAccountInfo.owner.toBase58()).to.be.eq(program.programId.toBase58())
      // check ticket AccountData
      const ticket = await program.account.unstakeTicket.fetch(newTicketAccount.publicKey);
      expect(ticket.beneficiary.toBase58()).to.be.eq(depositorUserKeyPair.publicKey.toBase58());
      expect(ticket.mainState.toBase58()).to.be.eq(mainStateKeyPair.publicKey.toBase58());
      const expectedDueDate = new Date().getTime()/1000 + 48*60*60
      expect(ticket.ticketDueTimestamp.toNumber()).to.be.greaterThan(expectedDueDate-10).and.lessThan(expectedDueDate+10);
      
      // check main state after
      const mainStateAfter = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);
      expect(mainStatePre.backingSolValue.sub(ticket.ticketSolValue).toString()).to.eql(mainStateAfter.backingSolValue.toString());

      // check mpSOL mint after
      const postMpSolMintSupply = new BN(await getTokenMintSupply(provider, mpsolTokenMintKeyPair.publicKey))
      expect(preMpSolMintSupply.sub(amountMpsolUnstaked).toString()).to.eql(postMpSolMintSupply.toString());
    }


    after(() => {
      // remove listeners
      program.removeEventListener(stakeEventListenerNumber)
    })


  });

});


