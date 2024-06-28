import { Keypair, PublicKey } from "@solana/web3.js";
import * as splStakePool from "@solana/spl-stake-pool";
// @ts-ignore: marinade-sdk has @coral-xyz/anchor and an older version of @solana/spl-token -- vscode intellisense gets confused
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, NATIVE_MINT, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getMint, unpackMint } from "@solana/spl-token";

import type { AccountInfo, Commitment, Connection } from '@solana/web3.js';

type AccountJsonDump = {
    pubkey: string;
    account: {
        lamports: number,
        data: string[]; // ["AQBz...==","base64"]
        owner: string; // e.g.:"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        executable: boolean;
        rentEpoch: number;
        space: number;
    }
}

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function convertJsonToAccountInfoBuffer(json: AccountJsonDump): AccountInfo<Buffer> {
    // Extract properties from the JSON object
    // json struct is the one resulting from the solana cli command
    // `solana account -u m --output json --output-file EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.json EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
    return {
        executable: json.account.executable,
        owner: new PublicKey(json.account.owner),
        lamports: json.account.lamports,
        data: Buffer.from(json.account.data[0], json.account.data[1] as BufferEncoding), // Decode account data
        rentEpoch: Number(json.account.rentEpoch),
    }
}

function convertAccountInfoBufferIntoAccountJsonDump(
    accountAddress: string,
    accountInfo: AccountInfo<Buffer>)
    : AccountJsonDump {
    return {
        pubkey: accountAddress,
        account: {
            executable: accountInfo.executable,
            owner: accountInfo.owner.toBase58(),
            lamports: accountInfo.lamports,
            data: [accountInfo.data.toString("base64"), "base64"],
            rentEpoch: accountInfo.rentEpoch,
            space: accountInfo.data.length,
        }
    }
}

async function take_test_mint_auth(mintAddress: string) {

    let localWalletFile = path.join(os.homedir(),".config", "solana","id.json")
    let localWalletPrivatekey: number[] = JSON.parse(fs.readFileSync(localWalletFile).toString())
    const localWalletKeypair = Keypair.fromSecretKey(Buffer.from(localWalletPrivatekey))

    let dumpFile = path.join("generated-data", mintAddress) + ".json"
    let accountInfoJsonDump = JSON.parse(fs.readFileSync(dumpFile).toString()) as AccountJsonDump
    // console.log(accountInfoJsonDump)
    // console.log(TOKEN_PROGRAM_ID.toBase58())
    // anchor.setProvider(anchor.AnchorProvider.env());
    let accountInfo: AccountInfo<Buffer> = convertJsonToAccountInfoBuffer(accountInfoJsonDump)

    const rawMint = MintLayout.decode(accountInfo.data.subarray(0, MintLayout.span));

    //console.log(rawMint)
    // change mintAuthority to localWallet.publicKey
    console.log(`change mint auth ${rawMint.mintAuthority.toBase58()} -> ${localWalletKeypair.publicKey.toBase58()}`)
    rawMint.mintAuthority = localWalletKeypair.publicKey

    let newData = new Uint8Array(2*accountInfo.data.length);
    let newSize = MintLayout.encode(rawMint, newData);
    let newDataBuffer = Buffer.from(newData.subarray(0,newSize))
    accountInfoJsonDump.account.data = [newDataBuffer.toString("base64"), "base64"]
    //accountInfoJsonDump.account.rentEpoch = accountInfoJsonDump.account.rentEpoch.toString()
    accountInfoJsonDump.account.rentEpoch = 9007199254740991 // bug: U64MAX can not be parsed by serde::json

    // save altered mint
    fs.writeFileSync(dumpFile, JSON.stringify(accountInfoJsonDump))

}
// console.log(process.argv)
// argv[0]=node, argv[1]=this-file.ts, 
take_test_mint_auth(process.argv[2])