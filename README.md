# Meta Pool Restaking Yield Aggregator

"The best yield aggregator on Solana. Built for smart stakers who like yields"

reference doc: https://docs.google.com/document/d/1LIU1ikWCmLfCvQsNjb4_iSgXcEOAg6uvNpQSsY-apDs

## Verifying the code

First, compile the programs to get its bytecode.

    anchor build

Now, install the [Ellipsis Labs verifiable build](https://crates.io/crates/solana-verify) crate.

    cargo install solana-verify

Get the executable hash of the bytecode from the program that was compiled

    solana-verify get-executable-hash target/deploy/main_vault.so

Get the hash from the bytecode of the on-chain program that you want to verify

    solana-verify get-program-hash -u <cluster url> \
        MVPpyLcH42bRtLXUWFnozcycqZ1WByvjDthCAgHh1fM

**Note for multisig members:** If you want to verify the upgrade program buffer,
then you need to get the bytecode from the buffer account using the below
command. You can get the buffer account address from the squads.

    solana-verify get-buffer-hash -u <cluster url> <buffer address>

If the hash outputs of those two commands match, the code in the
repository matches the on-chain programs code.

