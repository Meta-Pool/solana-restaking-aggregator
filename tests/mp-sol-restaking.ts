import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MpSolRestaking } from "../target/types/mp_sol_restaking";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";

import { expect } from 'chai';

const WSOL_TOKEN_MINT = NATIVE_MINT

const SANCTUM_WSOL_VALUE_CALCULATOR_PROGRAM = "wsoGmxQLSvwWpuaidCApxN5kEowLe2HLQLJhCQnj4bE"
const SANCTUM_SPL_SOL_VALUE_CALCULATOR_PROGRAM = "sp1V4h2gWorkGhVcazBc22Hfo2f5sd7jcjT4EDPrWFF"

function idlConstant(idl: anchor.Idl, name: string) {
  return JSON.parse(idl.constants.find(c => c.name == name).value)
}


describe("mp-sol-restaking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MpSolRestaking as Program<MpSolRestaking>;
  const provider = program.provider as anchor.AnchorProvider;
  const wallet = provider.wallet;

  const mainStateKeyPair = Keypair.generate()
  const mpsolTokenMintKeyPair = Keypair.generate()

  const operatorAuthKeyPair = Keypair.generate()
  const strategyRebalancerAuthKeyPair = Keypair.generate()

  it("Is initialized!", async () => {

    // const info1 = await provider.connection.getAccountInfo(new PublicKey(SANCTUM_WSOL_VALUE_CALCULATOR_PROGRAM));
    // console.log(info1)

    // const info2 = await provider.connection.getAccountInfo(new PublicKey(SANCTUM_SPL_SOL_VALUE_CALCULATOR_PROGRAM));
    // console.log(info2)

    // return;
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

    // creating a secondary vault
    console.log("creating a secondary vault")
    let wSol_token_mint = new PublicKey(WSOL_TOKEN_MINT);
    const [wSolSecondaryStateAddress, wSolSecondaryStateBump] =
      PublicKey.findProgramAddressSync(
        [
          mainStateKeyPair.publicKey.toBuffer(),
          wSol_token_mint.toBuffer(),
        ],
        program.programId
      )

    const [vaultManagerAuth, vaultManagerAuthBump] =
      PublicKey.findProgramAddressSync(
        [
          mainStateKeyPair.publicKey.toBuffer(),
          idlConstant(program.idl, "vaultsManagerAuthSeed")
        ],
        program.programId
      )

    const vaultTokenAccountAddress =
      getAssociatedTokenAddressSync(wSol_token_mint, vaultManagerAuth, true);

    const tx2 = await program.methods.createSecondaryVault()
      .accounts({
        admin: wallet.publicKey,
        mainState: mainStateKeyPair.publicKey,
        tokenMint: wSol_token_mint,
        //vaultsManagerPdaAuthority: vaultManagerAuth,
        secondaryState: wSolSecondaryStateAddress,
        vaultTokenAccount: vaultTokenAccountAddress
      })
      .rpc();

      const secondaryVaultState = await program.account.secondaryVaultState.fetch(wSolSecondaryStateAddress);

      expect(secondaryVaultState.depositsDisabled).to.eql(true);
      expect(secondaryVaultState.inStrategiesAmount.toString()).to.eql("0");
      expect(secondaryVaultState.locallyStoredAmount.toString()).to.eql("0");
      expect(secondaryVaultState.tokenMint).to.eql(wSol_token_mint);
      expect(secondaryVaultState.solValue.toString()).to.eql("0");
      expect(secondaryVaultState.ticketsTargetSolAmount.toString()).to.eql("0");
      expect(secondaryVaultState.vaultTokenAccount).to.eql(vaultTokenAccountAddress);
      expect(secondaryVaultState.vaultTokenAmount.toString()).to.eql("0");
      expect(secondaryVaultState.whitelistedStrategies.length.toString()).to.eql("0");
  
  });


});

