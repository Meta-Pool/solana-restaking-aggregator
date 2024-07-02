import * as anchor from "@coral-xyz/anchor";
import { MpSolRestaking } from "../../target/types/mp_sol_restaking";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import * as util from "../util";

const provider = util.getNodeFileWalletProvider("DEVYT7nSvD4gzP6BH2N1ubUamErS4TXtBYwdVrFBBVr")
anchor.setProvider(provider)

const wallet = provider.wallet;
const operatorAuthKeyPair = provider.wallet;
const strategyRebalancerAuthKeyPair = operatorAuthKeyPair
const depositorUserKeyPair = operatorAuthKeyPair

const program = anchor.workspace.MpSolRestaking as anchor.Program<MpSolRestaking>;

createMainState()

async function createMainState(): Promise<
    {
        mainStateKeyPair: Keypair
        vaultAtaAuth: PublicKey
        depositorMpSolAta: PublicKey
    }> {

    const mpSolMintWalletProvider = util.getNodeFileWalletProvider("mPsoLV53uAGXnPJw63W91t2VDqCVZcU5rTh3PWzxnLr")
    const mainStateWalletProvider = util.getNodeFileWalletProvider("mpsoLeuCF3LwrJWbzxNd81xRafePFfPhsNvGsAMhUAA")
    console.log("main state address", mainStateWalletProvider.wallet.publicKey.toBase58())

    // ----------------------
    // initialize main state
    // ----------------------
    let tx = await program.methods.initialize(
        operatorAuthKeyPair.publicKey, strategyRebalancerAuthKeyPair.publicKey
    )
        .accounts({
            admin: wallet.publicKey,
            mainState: mainStateWalletProvider.publicKey,
            mpsolTokenMint: mpSolMintWalletProvider.publicKey,
        })
        .transaction()

    // simulate
    try {
        const result = await provider.simulate(tx);
        //console.log(result)
    }
    catch (ex) {
        console.log(ex)
        throw (ex)
    }
    await wallet.signTransaction(tx)
    await mainStateWalletProvider.wallet.signTransaction(tx)
    await mpSolMintWalletProvider.wallet.signTransaction(tx)
    
    const txHash = await
        provider.sendAndConfirm(tx)

    console.log("init main state tx hash", txHash)
    // check main state
    //const mainState = await program.account.mainVaultState.fetch(mainStateKeyPair.publicKey);

    /*
    const [mainVaultMintAuth, mainVaultMintAuthBump] =
        PublicKey.findProgramAddressSync(
            [
                mainStateKeyPair.publicKey.toBuffer(),
                idlConstant(program.idl, "mainVaultMintAuthSeed")
            ],
            program.programId
        )

    const decodedMint = await getMint(provider.connection, shareTokenKeyPair.publicKey)
    expect(decodedMint.decimals).to.eql(9);
    expect(decodedMint.mintAuthority).to.eql(mainVaultMintAuth);
    expect(decodedMint.freezeAuthority).to.eql(mainVaultMintAuth);

    // create depositor mpsol ATA account
    let depositorMpSolAta = await createAta(provider, wallet, shareTokenKeyPair.publicKey, depositorUserKeyPair.publicKey)

    // compute common PDAs
    const [vaultAtaAuth, vaultAtaAuthBump] = PublicKey.findProgramAddressSync(
        [mainStateKeyPair.publicKey.toBuffer(), idlConstant(program.idl, "vaultsAtaAuthSeed")]
        , program.programId);

    // ------------------------------
    // create wSOL secondary vault
    // ------------------------------
    let wSolSecondaryStateAddress =
        await testCreateSecondaryVault(mainStateKeyPair, "wSOL", WSOL_TOKEN_MINT);

    let amountWsolDeposited = new BN(1e11.toFixed())

    // test wSOL update price (simple, always 1)
    {
        const method = testGetUpdateVaultPriceMethod(mainStateKeyPair, "wSOL", WSOL_TOKEN_MINT);
        await method.rpc();
        let wSolSecondaryVaultState = await program.account.secondaryVaultState.fetch(wSolSecondaryStateAddress)
        expect(wSolSecondaryVaultState.lstSolPriceTimestamp.toNumber()).to.greaterThanOrEqual(new Date().getTime() / 1000 - 2);
        expect(wSolSecondaryVaultState.lstSolPriceP32.toString()).to.eql(TWO_POW_32);
    }

    console.log("test wSOL deposit")
    {
        // enable deposits in Wsol vault
        await program.methods.configureSecondaryVault({ depositsDisabled: false, tokenDepositCap: null })
            .accounts({
                admin: wallet.publicKey,
                mainState: mainStateKeyPair.publicKey,
                lstMint: new PublicKey(WSOL_TOKEN_MINT),
            })
            .rpc()

        const vaultWSolAta = await getAssociatedTokenAddressSync(
            new PublicKey(WSOL_TOKEN_MINT), vaultAtaAuth, true);

        const depositorAtaWSol = await getAssociatedTokenAddressSync(
            new PublicKey(WSOL_TOKEN_MINT), depositorUserKeyPair.publicKey, true);

        let stakeTx = await program.methods
            .stake(amountWsolDeposited, 0)
            .accounts({
                mainState: mainStateKeyPair.publicKey,
                lstMint: new PublicKey(WSOL_TOKEN_MINT),
                vaultLstAccount: vaultWSolAta,
                depositor: depositorUserKeyPair.publicKey,
                depositorLstAccount: depositorAtaWSol,
                mpsolMint: shareTokenKeyPair.publicKey,
                depositorMpsolAccount: depositorMpSolAta,
            })

        try {
            await stakeTx.simulate()
        } catch (ex) {
            console.error(ex)
            throw (ex)
        }
        await stakeTx.signers([depositorUserKeyPair]).rpc()
    }
        */
    return //{ mainStateKeyPair, vaultAtaAuth, depositorMpSolAta }
}
