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

async function get_program_data_address(mintAddress: string) {

    let dumpFile = path.join("test-genesis","generated-data", mintAddress) + ".json"
    let accountInfoJsonDump = JSON.parse(fs.readFileSync(dumpFile).toString()) as AccountJsonDump
    // console.log(accountInfoJsonDump)
    // console.log(TOKEN_PROGRAM_ID.toBase58())
    // anchor.setProvider(anchor.AnchorProvider.env());
    let data = Buffer.from(accountInfoJsonDump.account.data[0], accountInfoJsonDump.account.data[1] as BufferEncoding)
    let programDataAddress = new PublicKey(data.subarray(4))
    console.log(programDataAddress.toBase58())

}
// console.log(process.argv)
// argv[0]=node, argv[1]=this-file.ts, 
get_program_data_address(process.argv[2])
