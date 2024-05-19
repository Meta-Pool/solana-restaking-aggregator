import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MpSolRestaking } from "../target/types/mp_sol_restaking";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
import * as splStakePool from "@solana/spl-stake-pool";

import { expect } from 'chai';
import { test } from "mocha";

const ONE_BILLION: string = 1e9.toFixed()

const SPL_STAKE_POOL_PROGRAM = "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"

const WSOL_TOKEN_MINT = NATIVE_MINT.toBase58()
const JITO_SOL_TOKEN_MINT = "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"
const JITO_SOL_SPL_STAKE_POOL_STATE_ADDRESS = "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"

anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.MpSolRestaking as Program<MpSolRestaking>;
const provider = program.provider as anchor.AnchorProvider;
const wallet = provider.wallet;

const mainStateKeyPair = Keypair.generate()
const mpsolTokenMintKeyPair = Keypair.generate()

const operatorAuthKeyPair = Keypair.generate()
const strategyRebalancerAuthKeyPair = Keypair.generate()

function idlConstant(idl: anchor.Idl, name: string) {
  try {
    return JSON.parse(idl.constants.find(c => c.name == name).value)
  } catch (ex) {
    throw new Error(`idlConstant("${name}"): ${ex}`)
  }
}

function formatPrice(priceString: string) {
  return `${priceString.slice(0,-9)}.${priceString.slice(-9)}`
}

//-------------------------------
/// returns vault state address
async function testCreateSecondaryVault(tokenName: string, tokenMint: string): Promise<PublicKey> {
  // creating a secondary vault
  console.log(`creating ${tokenName} secondary vault, tokenMint:${tokenMint}`)
  let tokenMintPublickey = new PublicKey(tokenMint);
  const [vaultSecondaryStateAddress, wSolSecondaryStateBump] =
    PublicKey.findProgramAddressSync(
      [
        mainStateKeyPair.publicKey.toBuffer(),
        tokenMintPublickey.toBuffer(),
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
    getAssociatedTokenAddressSync(tokenMintPublickey, vaultsTokenAtaPdaAuth, true);

  const tx2 = await program.methods.createSecondaryVault()
    .accounts({
      admin: wallet.publicKey,
      mainState: mainStateKeyPair.publicKey,
      tokenMint: tokenMintPublickey,
      secondaryState: vaultSecondaryStateAddress,
      vaultTokenAccount: vaultTokenAccountAddress
    })
    .rpc();

  {
    const secondaryVaultState = await program.account.secondaryVaultState.fetch(vaultSecondaryStateAddress);
    expect(secondaryVaultState.depositsDisabled).to.eql(true);
    expect(secondaryVaultState.inStrategiesAmount.toString()).to.eql("0");
    expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql("0");
    expect(secondaryVaultState.tokenMint).to.eql(tokenMintPublickey);
    expect(secondaryVaultState.tokenSolPrice.toString()).to.eql("0");
    expect(secondaryVaultState.solValue.toString()).to.eql("0");
    expect(secondaryVaultState.ticketsTargetSolAmount.toString()).to.eql("0");
    expect(secondaryVaultState.vaultTokenAccount).to.eql(vaultTokenAccountAddress);
    expect(secondaryVaultState.vaultTokenAmount.toString()).to.eql("0");
    expect(secondaryVaultState.whitelistedStrategies.length.toString()).to.eql("0");
  }

  return vaultSecondaryStateAddress
}

//-------------------------------
/// returns vault state contents
function testGetUpdateVaultPriceMethod(tokenName: string, tokenMint: string, vaultStateAddress: PublicKey) {
  // -----------------------
  console.log(`update ${tokenName} vault token price, tokenMint:${tokenMint}`)
  return program.methods.updateVaultTokenSolPrice()
    .accounts({
      admin: wallet.publicKey,
      secondaryState: vaultStateAddress,
      mainState: mainStateKeyPair.publicKey,
    })
    .remainingAccounts([])
}


// ------------------------------
describe("mp-sol-restaking", () => {
  // Configure the client to use the local cluster.

  it("Is initialized!", async () => {

    // initialize main vault
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

    // create wSOL secondary vault
    let wSolSecondaryStateAddress =
      await testCreateSecondaryVault("wSOL", WSOL_TOKEN_MINT
      );

    // test wSOL update price (simple, always 1)
    {
      const method = testGetUpdateVaultPriceMethod("wSOL", WSOL_TOKEN_MINT, wSolSecondaryStateAddress);
      await method.rpc();
      let wSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(wSolSecondaryStateAddress)
      expect(wSolSecondaryVaultState.tokenSolPrice.toString()).to.eql(ONE_BILLION);
    }

    // create JitoSOL secondary vault
    let jitoSolSecondaryVaultStateAddress =
      await testCreateSecondaryVault("JitoSOL", JITO_SOL_TOKEN_MINT
      );

    // test SPl-stake-pool update price (using jitoSOL SPL-stake-pool as example)
    {
      let jitoSolSplStakePoolStatePubKey = new PublicKey(JITO_SOL_SPL_STAKE_POOL_STATE_ADDRESS)
      // 1st get jitoSOL price by using @solana/spl-stake-pool SDK
      let poolInfoViaSdk = await splStakePool.stakePoolInfo(provider.connection, jitoSolSplStakePoolStatePubKey)
      // console.log(poolInfoViaSdk)
      const sdkComputedPrice = BigInt(poolInfoViaSdk.totalLamports) * BigInt(ONE_BILLION) / BigInt(poolInfoViaSdk.poolTokenSupply);

      // 2nd call UpdateVaultPriceMethod for jitoSolSecondaryVaultStateAddress
      const method = testGetUpdateVaultPriceMethod("jitoSOL", JITO_SOL_TOKEN_MINT, jitoSolSecondaryVaultStateAddress)
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
      console.log(formatPrice(jitoSolSecondaryVaultState.tokenSolPrice.toString()))
      expect(jitoSolSecondaryVaultState.tokenSolPrice.toString()).to.eql(sdkComputedPrice.toString());
    }

  });


});

