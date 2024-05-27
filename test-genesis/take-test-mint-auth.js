"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
// @ts-ignore: marinade-sdk has @coral-xyz/anchor and an older version of @solana/spl-token -- vscode intellisense gets confused
const spl_token_1 = require("@solana/spl-token");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
function convertJsonToAccountInfoBuffer(json) {
    // Extract properties from the JSON object
    // json struct is the one resulting from the solana cli command
    // `solana account -u m --output json --output-file EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.json EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
    return {
        executable: json.account.executable,
        owner: new web3_js_1.PublicKey(json.account.owner),
        lamports: json.account.lamports,
        data: Buffer.from(json.account.data[0], json.account.data[1]), // Decode account data
        rentEpoch: Number(json.account.rentEpoch),
    };
}
function convertAccountInfoBufferIntoAccountJsonDump(accountAddress, accountInfo) {
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
    };
}
function take_test_mint_auth(mintAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        let localWalletFile = path.join(os.homedir(), ".config", "solana", "id.json");
        let localWalletPrivatekey = JSON.parse(fs.readFileSync(localWalletFile).toString());
        const localWalletKeypair = web3_js_1.Keypair.fromSecretKey(Buffer.from(localWalletPrivatekey));
        let dumpFile = path.join("test-genesis", "generated-data", mintAddress) + ".json";
        let accountInfoJsonDump = JSON.parse(fs.readFileSync(dumpFile).toString());
        // console.log(accountInfoJsonDump)
        // console.log(TOKEN_PROGRAM_ID.toBase58())
        // anchor.setProvider(anchor.AnchorProvider.env());
        let accountInfo = convertJsonToAccountInfoBuffer(accountInfoJsonDump);
        const rawMint = spl_token_1.MintLayout.decode(accountInfo.data.subarray(0, spl_token_1.MintLayout.span));
        //console.log(rawMint)
        // change mintAuthority to localWallet.publicKey
        console.log(`change mint auth ${rawMint.mintAuthority.toBase58()} -> ${localWalletKeypair.publicKey.toBase58()}`);
        rawMint.mintAuthority = localWalletKeypair.publicKey;
        let newData = new Uint8Array(2 * accountInfo.data.length);
        let newSize = spl_token_1.MintLayout.encode(rawMint, newData);
        let newDataBuffer = Buffer.from(newData.subarray(0, newSize));
        accountInfoJsonDump.account.data = [newDataBuffer.toString("base64"), "base64"];
        //accountInfoJsonDump.account.rentEpoch = accountInfoJsonDump.account.rentEpoch.toString()
        accountInfoJsonDump.account.rentEpoch = 9007199254740991; // bug: U64MAX can not be parsed by serde::json
        // save altered mint
        fs.writeFileSync(dumpFile, JSON.stringify(accountInfoJsonDump));
    });
}
// console.log(process.argv)
// argv[0]=node, argv[1]=this-file.ts, 
take_test_mint_auth(process.argv[2]);
