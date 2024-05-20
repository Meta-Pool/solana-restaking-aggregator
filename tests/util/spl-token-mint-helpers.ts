import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";
///import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    Token,
    createMintToInstruction,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN, Wallet } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Provider } from "@marinade.finance/marinade-ts-sdk";
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

// Function to mint tokens
export async function createAta(provider: Provider, wallet: any, mint: PublicKey, recipient: PublicKey)
    : Promise<PublicKey> {

    const connection: Connection = provider.connection

    const instructions: TransactionInstruction[] = [];

    // 1. Get the associated token account address for the recipient
    const associatedTokenAddress = await getAssociatedTokenAddressSync(mint, recipient);
    console.log("associatedTokenAddress", associatedTokenAddress.toBase58())

    instructions.push(createAssociatedTokenAccountInstruction(
        wallet.payer.publicKey,
        associatedTokenAddress,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    ));

    const tx = new Transaction(await connection.getLatestBlockhash());
    tx.feePayer = wallet.payer.publicKey
    tx.add(...instructions);

    // let stakeMsolTx = new Transaction( await provider.connection.getLatestBlockhash());
    // stakeMsolTx.feePayer = wallet.publicKey
    // stakeMsolTx.add(depositResult.transaction)
    // stakeMsolTx = await wallet.signTransaction(stakeMsolTx)
    // await provider.sendAndConfirm(stakeMsolTx);

    // Sign the transaction
    //wallet.signTransaction(tx)
    tx.partialSign(wallet.payer);

    // Send and confirm the transaction
    //const signature = await sendAndConfirmTransaction(connection, tx);
    //console.log("send and confirm mint-to");
    const signature = await provider.sendAndConfirm(tx);
    //console.log("Transaction signature:", signature);

    return associatedTokenAddress
}

// Function to mint tokens
export async function mintTokens(provider: Provider, wallet: any, mint: PublicKey, recipient: PublicKey, amount: number)
    : Promise<PublicKey> {

    const connection: Connection = provider.connection

    const instructions: TransactionInstruction[] = [];

    // 1. Get the associated token account address for the recipient
    const associatedTokenAddress = await getAssociatedTokenAddressSync(mint, recipient);

    instructions.push(createAssociatedTokenAccountIdempotentInstruction(
        wallet.payer.publicKey,
        associatedTokenAddress,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    ));

    // 3. Mint tokens to the associated token account
    instructions.push(
        createMintToInstruction(mint, associatedTokenAddress, wallet.publicKey, amount)
    );

    const tx = new Transaction(await connection.getLatestBlockhash());
    tx.feePayer = wallet.payer.publicKey
    tx.add(...instructions);

    // let stakeMsolTx = new Transaction( await provider.connection.getLatestBlockhash());
    // stakeMsolTx.feePayer = wallet.publicKey
    // stakeMsolTx.add(depositResult.transaction)
    // stakeMsolTx = await wallet.signTransaction(stakeMsolTx)
    // await provider.sendAndConfirm(stakeMsolTx);

    // Sign the transaction
    //wallet.signTransaction(tx)
    tx.partialSign(wallet.payer);

    // Send and confirm the transaction
    //const signature = await sendAndConfirmTransaction(connection, tx);
    console.log("send and confirm mint-to");
    const signature = await provider.sendAndConfirm(tx);
    //console.log("Transaction signature:", signature);

    console.log(`Minted ${amount} tokens to ${recipient}`);

    return associatedTokenAddress
}

export async function getTokenAccountBalance(provider: Provider, tokenAccount: PublicKey): Promise<string> {
    let result = await provider.connection.getTokenAccountBalance(tokenAccount)
    return result.value.amount
}

export async function getTokenMintSupply(provider: Provider, mintAccount: PublicKey): Promise<string> {
    let result = await provider.connection.getTokenSupply(mintAccount)
    return result.value.amount
}