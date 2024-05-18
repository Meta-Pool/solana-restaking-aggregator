import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MpSolRestaking } from "../target/types/mp_sol_restaking";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";

import { expect } from 'chai';

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

  const SANCTUM_WSOL_VALUE_CALCULATOR_PROGRAM = "wsoGmxQLSvwWpuaidCApxN5kEowLe2HLQLJhCQnj4bE"
  const SANCTUM_SPL_SOL_VALUE_CALCULATOR_PROGRAM = "sp1V4h2gWorkGhVcazBc22Hfo2f5sd7jcjT4EDPrWFF"

  it("Is initialized!", async () => {
    
    // const info1 = await provider.connection.getAccountInfo(new PublicKey(SANCTUM_WSOL_VALUE_CALCULATOR_PROGRAM));
    // console.log(info1)
    
    // const info2 = await provider.connection.getAccountInfo(new PublicKey(SANCTUM_SPL_SOL_VALUE_CALCULATOR_PROGRAM));
    // console.log(info2)

    // return;


    const tx = await program.methods.initialize()
      .accounts({
        admin: wallet.publicKey,
        mainState: mainStateKeyPair.publicKey,
        mpsolTokenMint: mpsolTokenMintKeyPair.publicKey,
      })
      .signers([mainStateKeyPair, mpsolTokenMintKeyPair]) // note: provider.wallet is automatically included as payer
      .rpc();
    //console.log("Your transaction signature", tx);

    const mainState = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);

    expect(mainState.admin).to.eql(wallet.publicKey);
    expect(mainState.mpsolMint).to.eql(mpsolTokenMintKeyPair.publicKey);
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

  });
});
