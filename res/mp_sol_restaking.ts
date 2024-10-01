/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/mp_sol_restaking.json`.
 */
export type MpSolRestaking = {
  "address": "MPSoLoEnfNRFReRZSVH2V8AffSmWSR4dVoBLFm1YpAW",
  "metadata": {
    "name": "mpSolRestaking",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "mpSOL restaking yield aggregator - The best yield aggregator on Solana. Built for smart stakers who like money"
  },
  "instructions": [
    {
      "name": "attachCommonStrategyState",
      "discriminator": [
        56,
        218,
        73,
        216,
        2,
        231,
        166,
        141
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState"
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultState"
          ]
        },
        {
          "name": "vaultState",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "commonStrategyState"
        },
        {
          "name": "vaultStrategyRelationEntry",
          "docs": [
            "account to be created"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  116,
                  114,
                  97,
                  116,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "strategyProgramCode"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "configureMainVault",
      "discriminator": [
        202,
        251,
        130,
        150,
        135,
        244,
        102,
        232
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "values",
          "type": {
            "defined": {
              "name": "configureMainVaultValues"
            }
          }
        }
      ]
    },
    {
      "name": "configureSecondaryVault",
      "discriminator": [
        52,
        205,
        12,
        124,
        11,
        50,
        216,
        218
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState"
        },
        {
          "name": "lstMint"
        },
        {
          "name": "secondaryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "values",
          "type": {
            "defined": {
              "name": "configureSecondaryVaultValues"
            }
          }
        }
      ]
    },
    {
      "name": "configureTreasuryAccount",
      "discriminator": [
        13,
        34,
        28,
        153,
        29,
        119,
        81,
        10
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "mpsolMint",
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "treasuryMpsolAccount"
        }
      ],
      "args": []
    },
    {
      "name": "createSecondaryVault",
      "discriminator": [
        102,
        18,
        167,
        145,
        4,
        214,
        35,
        246
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "lstMint"
        },
        {
          "name": "vaultState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultsAtaPdaAuth",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  115,
                  45,
                  97,
                  116,
                  97,
                  45,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vaultLstAccount"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "getLstFromStrat",
      "discriminator": [
        191,
        211,
        245,
        177,
        226,
        248,
        84,
        185
      ],
      "accounts": [
        {
          "name": "mainState",
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultState",
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "vaultState",
          "docs": [
            "secondary-vault state"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultsAtaPdaAuth",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  115,
                  45,
                  97,
                  116,
                  97,
                  45,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vaultLstAccount",
          "writable": true
        },
        {
          "name": "vaultStrategyRelationEntry",
          "docs": [
            "vault->strat relation entry",
            "if this account exists, the common_strategy_state was correctly attached to the system"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  116,
                  114,
                  97,
                  116,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "commonStrategyState",
          "docs": [
            "must be the one mentioned in vault_strategy_relation_entry"
          ],
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "vaultStratWithdrawAuth",
          "docs": [
            "for temp-ATA to move lst from strat back to the vault"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  115,
                  116,
                  95,
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "lstWithdrawAccount",
          "docs": [
            "temp-ATA to move lst from strat back to the vault"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initMetadata",
      "discriminator": [
        226,
        15,
        9,
        225,
        77,
        52,
        247,
        27
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState"
        },
        {
          "name": "mpsolMintPdaAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  105,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mpsolMint",
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "metadata",
          "docs": [
            "note: metaplex uses a different way to compute PDAs than anchor",
            "this should be PDA(\"metadata\",token_metadata_program,mint) program:token_metadata_program",
            "yes, token_metadata_program is repeated in the PDA generation"
          ],
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenMetadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mainState",
          "writable": true,
          "signer": true
        },
        {
          "name": "mpsolMintPdaAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  105,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mpsolTokenMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "operatorAuth",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeFreezeAuth",
      "discriminator": [
        141,
        21,
        189,
        59,
        188,
        23,
        164,
        167
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mainState"
        },
        {
          "name": "mpsolMint",
          "writable": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mpsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  105,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "setNextWithdrawAmount",
      "discriminator": [
        254,
        168,
        30,
        56,
        79,
        179,
        36,
        120
      ],
      "accounts": [
        {
          "name": "mainState",
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "operatorAuth",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "vaultStrategyRelationEntry",
          "docs": [
            "vault->strat relation entry",
            "if this account exists, the common_strategy_state was correctly attached to the system"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  116,
                  114,
                  97,
                  116,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "commonStrategyState",
          "docs": [
            "must be the one mentioned in vault_strategy_relation_entry"
          ],
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "vaultStratWithdrawAuth",
          "docs": [
            "for temp-ATA to move lst from strat back to the vault"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  115,
                  116,
                  95,
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "lstWithdrawAccount",
          "docs": [
            "temp-ATA to move lst from strat back to the vault"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "lstAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stake",
      "discriminator": [
        206,
        176,
        202,
        18,
        200,
        209,
        179,
        108
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultState"
          ]
        },
        {
          "name": "vaultState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultsAtaPdaAuth",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  115,
                  45,
                  97,
                  116,
                  97,
                  45,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vaultLstAccount",
          "writable": true
        },
        {
          "name": "depositor",
          "signer": true
        },
        {
          "name": "depositorLstAccount",
          "writable": true
        },
        {
          "name": "mpsolMint",
          "writable": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mpsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  105,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "depositorMpsolAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lstAmount",
          "type": "u64"
        },
        {
          "name": "refCode",
          "type": "u32"
        }
      ]
    },
    {
      "name": "ticketClaim",
      "discriminator": [
        66,
        60,
        0,
        233,
        251,
        163,
        110,
        122
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true,
          "relations": [
            "ticketAccount"
          ]
        },
        {
          "name": "beneficiary",
          "writable": true,
          "signer": true,
          "relations": [
            "ticketAccount"
          ]
        },
        {
          "name": "ticketAccount",
          "writable": true
        },
        {
          "name": "lstMint"
        },
        {
          "name": "beneficiaryLstAccount",
          "writable": true
        },
        {
          "name": "vaultState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultsAtaPdaAuth",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  115,
                  45,
                  97,
                  116,
                  97,
                  45,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vaultLstAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "withdrawSolValueAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferLstToStrat",
      "discriminator": [
        228,
        115,
        228,
        204,
        23,
        23,
        250,
        240
      ],
      "accounts": [
        {
          "name": "mainState",
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "operatorAuth",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultState",
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "vaultState",
          "docs": [
            "secondary-vault state"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultsAtaPdaAuth",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  115,
                  45,
                  97,
                  116,
                  97,
                  45,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vaultLstAccount",
          "writable": true
        },
        {
          "name": "vaultStrategyRelationEntry",
          "docs": [
            "vault->strat relation entry",
            "if this account exists, the common_strategy_state was correctly attached to the system"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  116,
                  114,
                  97,
                  116,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "strategyProgramCode"
        },
        {
          "name": "commonStrategyState",
          "docs": [
            "must be the one mentioned in vault_strategy_relation_entry"
          ],
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "strategyAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ],
            "program": {
              "kind": "account",
              "path": "strategyProgramCode"
            }
          }
        },
        {
          "name": "strategyDepositAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lstAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "discriminator": [
        90,
        95,
        107,
        42,
        205,
        124,
        50,
        225
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "unstaker",
          "writable": true,
          "signer": true
        },
        {
          "name": "unstakerMpsolAccount",
          "writable": true
        },
        {
          "name": "mpsolMint",
          "writable": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "treasuryMpsolAccount",
          "writable": true
        },
        {
          "name": "newTicketAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mpsolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateAttachedStratLstAmount",
      "discriminator": [
        190,
        250,
        156,
        206,
        33,
        235,
        97,
        183
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "lstMint",
          "relations": [
            "vaultState"
          ]
        },
        {
          "name": "vaultState",
          "docs": [
            "secondary-vault state"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        },
        {
          "name": "vaultStrategyRelationEntry",
          "docs": [
            "vault->strat relation entry",
            "if this account exists, the common_strategy_state was correctly attached to the system"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  116,
                  114,
                  97,
                  116,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "commonStrategyState",
          "docs": [
            "must be the one mentioned in vault_strategy_relation_entry"
          ],
          "relations": [
            "vaultStrategyRelationEntry"
          ]
        },
        {
          "name": "strategyAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "strategyDepositAccount"
        },
        {
          "name": "vaultStratWithdrawAuth",
          "docs": [
            "for temp-ATA to move lst from strat back to the vault"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  115,
                  116,
                  95,
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "commonStrategyState"
              }
            ]
          }
        },
        {
          "name": "lstWithdrawAccount",
          "docs": [
            "temp-ATA to move lst from strat back to the vault"
          ]
        },
        {
          "name": "mpsolMint",
          "writable": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "mpsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  105,
                  110,
                  45,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "treasuryMpsolAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "updateVaultTicketTarget",
      "discriminator": [
        109,
        92,
        224,
        248,
        208,
        218,
        227,
        184
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "operatorAuth",
          "signer": true,
          "relations": [
            "mainState"
          ]
        },
        {
          "name": "lstMint",
          "relations": [
            "secondaryState"
          ]
        },
        {
          "name": "secondaryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newTicketTargetSolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateVaultTokenSolPrice",
      "discriminator": [
        91,
        186,
        93,
        21,
        47,
        235,
        7,
        236
      ],
      "accounts": [
        {
          "name": "mainState",
          "writable": true
        },
        {
          "name": "lstMint",
          "relations": [
            "secondaryState"
          ]
        },
        {
          "name": "secondaryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mainState"
              },
              {
                "kind": "account",
                "path": "lstMint"
              }
            ]
          }
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "mainVaultState",
      "discriminator": [
        162,
        12,
        31,
        25,
        129,
        194,
        124,
        40
      ]
    },
    {
      "name": "secondaryVaultState",
      "discriminator": [
        214,
        177,
        254,
        97,
        196,
        222,
        191,
        199
      ]
    },
    {
      "name": "unstakeTicket",
      "discriminator": [
        131,
        84,
        209,
        38,
        145,
        157,
        181,
        127
      ]
    },
    {
      "name": "vaultStrategyRelationEntry",
      "discriminator": [
        161,
        40,
        119,
        237,
        160,
        148,
        124,
        128
      ]
    }
  ],
  "events": [
    {
      "name": "getLstFromStratEvent",
      "discriminator": [
        67,
        229,
        235,
        188,
        45,
        96,
        236,
        153
      ]
    },
    {
      "name": "stakeEvent",
      "discriminator": [
        226,
        134,
        188,
        173,
        19,
        33,
        75,
        175
      ]
    },
    {
      "name": "ticketClaimEvent",
      "discriminator": [
        112,
        108,
        233,
        231,
        134,
        45,
        234,
        213
      ]
    },
    {
      "name": "transferLstToStratEvent",
      "discriminator": [
        117,
        1,
        135,
        50,
        219,
        136,
        11,
        193
      ]
    },
    {
      "name": "unstakeEvent",
      "discriminator": [
        162,
        104,
        137,
        228,
        81,
        3,
        79,
        197
      ]
    },
    {
      "name": "updateAttachedStratLstAmountEvent",
      "discriminator": [
        150,
        70,
        44,
        239,
        41,
        28,
        206,
        221
      ]
    },
    {
      "name": "updateVaultTokenSolPriceEvent",
      "discriminator": [
        22,
        97,
        179,
        80,
        95,
        161,
        200,
        159
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidVaultIndex",
      "msg": "Invalid vault index "
    },
    {
      "code": 6001,
      "name": "tokenSolPriceIsStale",
      "msg": "token_sol_price is stale"
    },
    {
      "code": 6002,
      "name": "depositAmountToSmall",
      "msg": "Deposit amount too small"
    },
    {
      "code": 6003,
      "name": "withdrawAmountTooSmall",
      "msg": "Withdraw amount too small"
    },
    {
      "code": 6004,
      "name": "notEnoughTokensInTheVault",
      "msg": "not enough tokens in the vault"
    },
    {
      "code": 6005,
      "name": "vaultIndexHasDifferentVault",
      "msg": "vault at index is not the vault sent in the instruction"
    },
    {
      "code": 6006,
      "name": "maxWhitelistedVaultsReached",
      "msg": "max whitelisted vaults reached"
    },
    {
      "code": 6007,
      "name": "invalidAddingVaultState",
      "msg": "invalid adding vault state"
    },
    {
      "code": 6008,
      "name": "depositExceedsVaultCap",
      "msg": "Deposit exceeds vault cap"
    },
    {
      "code": 6009,
      "name": "incorrectMarinadeStateAddress",
      "msg": "Incorrect Marinade State Address"
    },
    {
      "code": 6010,
      "name": "accountTypeIsNotStakePool",
      "msg": "Spl Stake Pool State field AccountType != AccountTypeStakePool"
    },
    {
      "code": 6011,
      "name": "splStakePoolStateAccountOwnerIsNotTheSplStakePoolProgram",
      "msg": "Spl Stake Pool State account owner is not the Spl-Stake-Pool Program"
    },
    {
      "code": 6012,
      "name": "depositsInThisVaultAreDisabled",
      "msg": "Deposits in this vault are disabled"
    },
    {
      "code": 6013,
      "name": "invalidStoredLstPrice",
      "msg": "Invalid Stored Lst Price"
    },
    {
      "code": 6014,
      "name": "unstakeAmountTooSmall",
      "msg": "Unstake amount too small"
    },
    {
      "code": 6015,
      "name": "notEnoughSolValueInTicket",
      "msg": "Not enough SOL value in ticket "
    },
    {
      "code": 6016,
      "name": "withdrawAmountToSmall",
      "msg": "Withdraw amount too small"
    },
    {
      "code": 6017,
      "name": "ticketIsNotDueYet",
      "msg": "Ticket is not due yet"
    },
    {
      "code": 6018,
      "name": "notEnoughLstInVault",
      "msg": "Not Enough Lst in Vault"
    },
    {
      "code": 6019,
      "name": "missingLstStateInRemainingAccounts",
      "msg": "Missing Lst State in Remaining Accounts"
    },
    {
      "code": 6020,
      "name": "cantLeaveDustInTicket",
      "msg": "Can't Leave Dust In Ticket, either remove all or leave a significant amount"
    },
    {
      "code": 6021,
      "name": "invalidTreasuryMpsolAccount",
      "msg": "Invalid Treasury Mpsol Account"
    },
    {
      "code": 6022,
      "name": "performanceFeeTooHigh",
      "msg": "Performance Fee Too High"
    },
    {
      "code": 6023,
      "name": "errDeserializingCommonStrategyState",
      "msg": "Err deserializing common strategy state"
    },
    {
      "code": 6024,
      "name": "newStrategyLstAmountShouldBeZero",
      "msg": "new strategy lst amount should be 0"
    },
    {
      "code": 6025,
      "name": "amountIsZero",
      "msg": "amount is 0"
    },
    {
      "code": 6026,
      "name": "existingAmountIsZero",
      "msg": "existing amount is 0"
    },
    {
      "code": 6027,
      "name": "mustWithdrawAllPendingLst",
      "msg": "Must withdraw all pending lst"
    },
    {
      "code": 6028,
      "name": "withdrawFeeTooHigh",
      "msg": "Withdraw Fee Too High"
    }
  ],
  "types": [
    {
      "name": "configureMainVaultValues",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "unstakeTicketWaitingHours",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "withdrawFeeBp",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "performanceFeeBp",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "newAdminPubkey",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "configureSecondaryVaultValues",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositsDisabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "tokenDepositCap",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "getLstFromStratEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "vaultStrategyRelationEntry",
            "type": "pubkey"
          },
          {
            "name": "desiredAmount",
            "type": "u64"
          },
          {
            "name": "existentAmount",
            "type": "u64"
          },
          {
            "name": "lstAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "mainVaultState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "operatorAuth",
            "docs": [
              "authority to set parameters, token_deposit_caps & whitelisted_strategies, normally a DAO-authorized bot acting on votes"
            ],
            "type": "pubkey"
          },
          {
            "name": "withdrawFeeBp",
            "docs": [
              "authority to move tokens in or out strategies, normally a DAO-authorized bot acting on votes"
            ],
            "type": "u16"
          },
          {
            "name": "reservedSpace",
            "docs": [
              "reserved space for extensions"
            ],
            "type": {
              "array": [
                "u8",
                30
              ]
            }
          },
          {
            "name": "mpsolMint",
            "type": "pubkey"
          },
          {
            "name": "treasuryMpsolAccount",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "performanceFeeBp",
            "type": "u16"
          },
          {
            "name": "backingSolValue",
            "docs": [
              "SOL-value backing the mpsol.supply",
              "\"SOL-value\" is the estimation of the SOL backing all the LSTs stored in the vaults",
              "A \"SOL-value\" of 100 SOL can be represented by some LST-amount, as long as `LST-amount * LST/SOL-price = SOL-value`",
              "meaning if you have a SOL-value ticket of 100, you could withdraw 98.2 mSOL from the assets, or 92.1 JitoSOL, etc.",
              "mpSOL_price = backing_sol_value/mpSOL.supply",
              "When tokens are staked, backing_sol_value is incremented and mpSOL is minted: staking does not change mpSOL price.",
              "When rewards are computed in the vaults, backing_sol_value is increased, increasing mpSOL/SOL price",
              "invariant: sum(secondary_vault.vault_total_sol_value) = backing_sol_value + outstanding_tickets_sol_value"
            ],
            "type": "u64"
          },
          {
            "name": "outstandingTicketsSolValue",
            "docs": [
              "represents the sum of unstake-tickets created and not claimed yet",
              "When an unstaking is requested, the mpSOL is burned and the SOL-value is moved to \"outstanding_tickets_sol_value\"",
              "When a ticket is due and claimed (total or partially), the SOL-value is sent from a vault to the user",
              "and then `outstanding_tickets_sol_value is` reduced",
              "invariant: sum(secondary_vault.vault_total_sol_value) = backing_sol_value + outstanding_tickets_sol_value"
            ],
            "type": "u64"
          },
          {
            "name": "unstakeTicketWaitingHours",
            "docs": [
              "normally 48: number of hours for a ticket to be due"
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "secondaryVaultState",
      "docs": [
        "vault-state address is PDA(main_state, token_mint)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lstMint",
            "docs": [
              "the LST type stored in this vault"
            ],
            "type": "pubkey"
          },
          {
            "name": "lstSolPriceP32",
            "docs": [
              "LST-token/SOL price with 32-bit precision, cache of last computation of LST-token/SOL price,",
              "it is computed as `token_sol_price_p32 = LST-backing-lamports * 2^32 / LST-mint-supply`",
              "it is used to compute vault.sol_value.",
              "To obtain a human-readable price do: human_readable_price = token_sol_price_p32 / 2^32",
              "invariant: token_sol_price_p32 >= 2^32, because the min value for 1 LST is 1 SOL"
            ],
            "type": "u64"
          },
          {
            "name": "lstSolPriceTimestamp",
            "docs": [
              "last computation of token_sol_price, price is obtained ON-CHAIN, read from the LST token program state"
            ],
            "type": "u64"
          },
          {
            "name": "vaultTotalLstAmount",
            "docs": [
              "total lst amount backing this vault_total_sol_value",
              "To compute SOL value of the entire vault use: vault_total_lst_amount * lst_token_sol_price",
              "invariant: vault_total_token_amount = in_strategies_amount + locally_stored_amount"
            ],
            "type": "u64"
          },
          {
            "name": "locallyStoredAmount",
            "docs": [
              "token amount here (not in strategies)",
              "invariant: vault_total_lst_amount = in_strategies_amount + locally_stored_amount",
              "must eventually match vault_lst_ata (PDA ATA token account)"
            ],
            "type": "u64"
          },
          {
            "name": "inStrategiesAmount",
            "docs": [
              "token amount sent to strategies (belongs to this vault, part of assets, but not in vault_token_account)",
              "invariant: vault_total_lst_amount = in_strategies_amount + locally_stored_amount"
            ],
            "type": "u64"
          },
          {
            "name": "ticketsTargetSolAmount",
            "docs": [
              "\"tickets_target_sol_amount\" is set by the ticket-fulfiller crank, so this vault removes tokens from strategies",
              "increasing \"locally_stored_amount\" until it covers \"tickets_target_sol_amount\"",
              "in order to compute how much tokens are free to send to strategies, you must use fn `available_for_strategies_amount()`",
              "that subtracts this value from locally_stored_amount"
            ],
            "type": "u64"
          },
          {
            "name": "depositsDisabled",
            "docs": [
              "if true: only-withdraw mode"
            ],
            "type": "bool"
          },
          {
            "name": "tokenDepositCap",
            "docs": [
              "0 means no cap - measured in vault accepted tokens"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stakeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "depositor",
            "type": "pubkey"
          },
          {
            "name": "refCode",
            "type": "u32"
          },
          {
            "name": "lstAmount",
            "type": "u64"
          },
          {
            "name": "depositedSolValue",
            "type": "u64"
          },
          {
            "name": "depositorLstAccount",
            "type": "pubkey"
          },
          {
            "name": "depositorMpsolAccount",
            "type": "pubkey"
          },
          {
            "name": "mpsolReceived",
            "type": "u64"
          },
          {
            "name": "mainVaultBackingSolValue",
            "type": "u64"
          },
          {
            "name": "mpsolSupply",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ticketClaimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "ticketAccount",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "claimedSolValue",
            "type": "u64"
          },
          {
            "name": "ticketSolValueRemaining",
            "type": "u64"
          },
          {
            "name": "lstAmountDelivered",
            "type": "u64"
          },
          {
            "name": "ticketDueTimestamp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "transferLstToStratEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "vaultStrategyRelationEntry",
            "type": "pubkey"
          },
          {
            "name": "lstAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "unstakeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "unstaker",
            "type": "pubkey"
          },
          {
            "name": "mpsolAmount",
            "type": "u64"
          },
          {
            "name": "unstakerMpsolAccount",
            "type": "pubkey"
          },
          {
            "name": "mpsolBurned",
            "type": "u64"
          },
          {
            "name": "ticketAccount",
            "type": "pubkey"
          },
          {
            "name": "ticketSolValue",
            "type": "u64"
          },
          {
            "name": "ticketDueTimestamp",
            "type": "u64"
          },
          {
            "name": "mainVaultBackingSolValue",
            "type": "u64"
          },
          {
            "name": "mpsolSupply",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "unstakeTicket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "docs": [
              "auth that can withdraw the LSTs when due"
            ],
            "type": "pubkey"
          },
          {
            "name": "ticketSolValue",
            "docs": [
              "amount (lamports) this ticket is worth (set at unstake) -- can be updated on partial ticket withdraws"
            ],
            "type": "u64"
          },
          {
            "name": "ticketDueTimestamp",
            "docs": [
              "when this ticket is due (unix timestamp)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "updateAttachedStratLstAmountEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "vaultStrategyRelationEntry",
            "type": "pubkey"
          },
          {
            "name": "oldLstAmount",
            "type": "u64"
          },
          {
            "name": "newLstAmount",
            "type": "u64"
          },
          {
            "name": "lstPriceP32",
            "type": "u64"
          },
          {
            "name": "mainVaultBackingSolValue",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "updateVaultTokenSolPriceEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "type": "pubkey"
          },
          {
            "name": "lstAmount",
            "type": "u64"
          },
          {
            "name": "oldPriceP32",
            "type": "u64"
          },
          {
            "name": "oldSolValue",
            "type": "u64"
          },
          {
            "name": "newPriceP32",
            "type": "u64"
          },
          {
            "name": "newSolValue",
            "type": "u64"
          },
          {
            "name": "mainVaultBackingSolValue",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vaultStrategyRelationEntry",
      "docs": [
        "state created when a CommonVaultStrategyState is attached to a secondary-vault",
        "main_state + lst_mint + common_strategy_state => VaultStrategyRelationEntry PDA"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mainState",
            "type": "pubkey"
          },
          {
            "name": "lstMint",
            "docs": [
              "main_state + lst_mint => secondary-vault PDA"
            ],
            "type": "pubkey"
          },
          {
            "name": "commonStrategyState",
            "docs": [
              "Several common_strategy_state accounts can exist for a single strategy_program_code",
              "Each common_strategy_state account has a common first part struct `CommonVaultStrategyState`",
              "and it references A SPECIFIC LST mint & vault. Yields are computed in that lst.",
              "PDAs:",
              "this-program + main_state + lst_mint + common_strategy_state => VaultStrategyRelationEntry PDA",
              "strategy_program_code + common_strategy_state + \"AUTH\" => strategy-Auth-PDA",
              "associated-token-program + lst_mint + strategy-Auth-PDA => strategy-lst-ATA holding CommonVaultStrategyState.locally_stored_amount"
            ],
            "type": "pubkey"
          },
          {
            "name": "strategyProgramCode",
            "docs": [
              "strategy program code, owner of common_strategy_state"
            ],
            "type": "pubkey"
          },
          {
            "name": "nextWithdrawLstAmount",
            "docs": [
              "target amount for the next withdraw",
              "the strat should wind-down positions so this amount can be withdrawn",
              "once withdrawn (call to strat-program) and in the same tx, set this value to zero"
            ],
            "type": "u64"
          },
          {
            "name": "ticketsTargetSolAmount",
            "docs": [
              "\"tickets_target_sol_amount\" is set by the ticket-fulfiller crank, so the strat removes tokens from external-programs",
              "increasing \"locally_stored_amount\" until it covers \"tickets_target_sol_amount\"",
              "in order to compute how much tokens are free to send to external-programs, do: locally_stored_amount - lst_value(tickets_target_sol_amount)"
            ],
            "type": "u64"
          },
          {
            "name": "lastReadStratLstAmount",
            "docs": [
              "last computation of lst-token amount in the strategy.",
              "When the `common_strategy_state.strat_total_lst_amount` increases above `last_strat_lst_amount`, a profit is recorded",
              "Incremented when depositing the LST token in the strategy",
              "Reduced manually when removing LST tokens from the strategy",
              "Incremented during strategy-amount-update, if the strategy generated yield in the form of more lst tokens"
            ],
            "type": "u64"
          },
          {
            "name": "lastReadStratLstTimestamp",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "authoritySeed",
      "type": "bytes",
      "value": "[97, 117, 116, 104, 111, 114, 105, 116, 121]"
    },
    {
      "name": "mainVaultMintAuthSeed",
      "type": "bytes",
      "value": "[109, 97, 105, 110, 45, 109, 105, 110, 116]"
    },
    {
      "name": "maxPerformanceFeeBp",
      "type": "u16",
      "value": "2500"
    },
    {
      "name": "maxWhitelistedVaults",
      "type": "u8",
      "value": "64"
    },
    {
      "name": "maxWhitelistedVaultStrategies",
      "type": "u8",
      "value": "64"
    },
    {
      "name": "maxWithdrawFeeBp",
      "type": "u16",
      "value": "100"
    },
    {
      "name": "minMovementLamports",
      "type": "u64",
      "value": "1000000"
    },
    {
      "name": "vaultsAtaAuthSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116, 115, 45, 97, 116, 97, 45, 97, 117, 116, 104]"
    },
    {
      "name": "vaultStratEntrySeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116, 45, 115, 116, 114, 97, 116, 45, 101, 110, 116, 114, 121]"
    },
    {
      "name": "vaultStratWithdrawAtaAuthSeed",
      "type": "bytes",
      "value": "[108, 115, 116, 95, 119, 105, 116, 104, 100, 114, 97, 119, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]"
    }
  ]
};
