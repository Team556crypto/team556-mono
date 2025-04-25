export type Team = {
  "version": "0.1.0",
  "name": "team",
  "instructions": [
    {
      "name": "initializeVesting",
      "docs": [
        "Initializes a new vesting account for a beneficiary.",
        "",
        "This function creates a vesting schedule, initializes a Program Derived Address (PDA)",
        "to hold the vesting state and tokens, and transfers the total amount of tokens",
        "from the admin's account to the PDA's token account.",
        "",
        "Only the designated admin wallet (`ADMIN_PUBKEY`) can call this function.",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for initialization.",
        "* `wallet_type`: The type of wallet being initialized (e.g., Dev, Marketing),",
        "which dictates the expected schedule length.",
        "* `total_amount`: The total number of tokens to be vested according to the schedule.",
        "* `schedule`: A vector defining the vesting cliffs (release time and amount)."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account, must be a signer and match `ADMIN_PUBKEY`. Pays for account creation."
          ]
        },
        {
          "name": "adminTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The admin's SPL token account, from which tokens will be transferred. Must be mutable."
          ]
        },
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary account (wallet address). Used as a seed for the PDA. Mutable for potential future use.",
            "It is marked mutable because the `init` constraint on `vesting_account` requires the payer (`admin`)",
            "to be mutable, and implicitly, other accounts involved might need to be."
          ]
        },
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA. Initialized by this instruction.",
            "Stores the vesting schedule, beneficiary, mint, amounts, and bump seed.",
            "Seeds: \"vesting\", beneficiary pubkey."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Mint account of the SPL token being vested. Used for type safety and ATA initialization."
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The SPL token account associated with the `vesting_account` PDA. Initialized by this instruction.",
            "This account will hold the tokens being vested.",
            "Authority is automatically set to the `vesting_account` PDA itself via `associated_token::authority`."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Solana System Program, required for creating accounts (`init`)."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for token operations (transfer, ATA init)."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Associated Token Account Program, required for initializing the `vesting_token_account`."
          ]
        }
      ],
      "args": [
        {
          "name": "walletType",
          "type": {
            "defined": "WalletType"
          }
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "schedule",
          "type": {
            "vec": {
              "defined": "VestingSchedule"
            }
          }
        }
      ]
    },
    {
      "name": "claimUnlocked",
      "docs": [
        "Allows the beneficiary (`authority`) to claim tokens that have become unlocked",
        "according to the vesting schedule.",
        "",
        "Tokens are transferred from the vesting PDA's token account to the beneficiary's",
        "specified token account (`destination_token_account`).",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for claiming."
      ],
      "accounts": [
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA containing the schedule and state. Mutable because `claimed_amount` is updated.",
            "`has_one = authority` constraint ensures the `authority` signer matches the one stored in the account."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The beneficiary of the vesting schedule, must be a signer to authorize the claim."
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The PDA's SPL token account holding the vested tokens. Mutable because its balance decreases.",
            "constraint = vesting_token_account.mint == vesting_account.mint,",
            "constraint = vesting_token_account.owner == vesting_signer.key() // Checked manually in handler"
          ]
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary's SPL token account where claimed tokens will be deposited. Mutable because its balance increases.",
            "constraint = destination_token_account.mint == vesting_account.mint @ VestingError::InvalidMint"
          ]
        },
        {
          "name": "vestingSigner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The vesting account PDA, required as the authority for the token transfer CPI.",
            "derived from seeds (`vesting_account.authority`, `vesting_account.bump`) within the handler logic."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for the token transfer CPI."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "adminDistributeUnlocked",
      "docs": [
        "Allows the admin to distribute unlocked tokens to beneficiaries automatically.",
        "",
        "This function enables automated distribution without requiring beneficiaries to manually claim.",
        "Only the designated admin wallet (`ADMIN_PUBKEY`) can call this function.",
        "",
        "Similar to `claim_unlocked`, but can be initiated by the admin on behalf of beneficiaries.",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for the admin-initiated distribution."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The admin account (must match ADMIN_PUBKEY)"
          ]
        },
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA containing the schedule and state. Mutable because `claimed_amount` is updated."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The beneficiary who will receive the tokens"
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The PDA's SPL token account holding the vested tokens. Mutable because its balance decreases."
          ]
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary's SPL token account where claimed tokens will be deposited. Mutable because its balance increases."
          ]
        },
        {
          "name": "vestingSigner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The vesting account PDA, required as the authority for the token transfer CPI."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for the token transfer CPI."
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "vestingAccount",
      "docs": [
        "Represents the state of a vesting schedule stored in the PDA."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The public key of the beneficiary who can claim the tokens. Used in `has_one` and PDA seeds."
            ],
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The mint address of the SPL token being vested."
            ],
            "type": "publicKey"
          },
          {
            "name": "totalAmount",
            "docs": [
              "The total amount of tokens initially locked in the schedule."
            ],
            "type": "u64"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "The amount of tokens already claimed by the beneficiary."
            ],
            "type": "u64"
          },
          {
            "name": "schedule",
            "docs": [
              "The vector containing individual vesting cliffs (time and amount)."
            ],
            "type": {
              "vec": {
                "defined": "VestingSchedule"
              }
            }
          },
          {
            "name": "walletType",
            "docs": [
              "The type of wallet this schedule corresponds to (e.g., Dev, Marketing)."
            ],
            "type": {
              "defined": "WalletType"
            }
          },
          {
            "name": "bump",
            "docs": [
              "The bump seed used for the PDA derivation. Required for CPI signing."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VestingSchedule",
      "docs": [
        "Represents a single vesting cliff in the schedule."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "releaseTime",
            "docs": [
              "The Unix timestamp (seconds since epoch) when the amount becomes unlocked."
            ],
            "type": "u64"
          },
          {
            "name": "amount",
            "docs": [
              "The amount of tokens unlocked at the `release_time`."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "WalletType",
      "docs": [
        "Enum defining different types of vesting schedules (e.g., based on recipient role).",
        "Used to enforce specific schedule lengths during initialization."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Dev"
          },
          {
            "name": "Marketing"
          },
          {
            "name": "Presale1"
          },
          {
            "name": "Presale2"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized: Only the admin can perform this action."
    },
    {
      "code": 6001,
      "name": "InvalidSchedule",
      "msg": "Invalid schedule: Schedule does not meet requirements (length, order, amounts)."
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "Invalid mint: Provided token account mint does not match vesting mint."
    },
    {
      "code": 6003,
      "name": "NothingToClaim",
      "msg": "Nothing to claim: No tokens are currently claimable."
    },
    {
      "code": 6004,
      "name": "InvalidAuthority",
      "msg": "Invalid authority: Signer does not match vesting account authority."
    },
    {
      "code": 6005,
      "name": "InvalidPda",
      "msg": "Invalid PDA: Provided vesting signer account is not the correct PDA."
    },
    {
      "code": 6006,
      "name": "InvalidOwner",
      "msg": "Invalid owner: Vesting token account is not owned by the vesting PDA."
    }
  ]
};

export const IDL: Team = {
  "version": "0.1.0",
  "name": "team",
  "instructions": [
    {
      "name": "initializeVesting",
      "docs": [
        "Initializes a new vesting account for a beneficiary.",
        "",
        "This function creates a vesting schedule, initializes a Program Derived Address (PDA)",
        "to hold the vesting state and tokens, and transfers the total amount of tokens",
        "from the admin's account to the PDA's token account.",
        "",
        "Only the designated admin wallet (`ADMIN_PUBKEY`) can call this function.",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for initialization.",
        "* `wallet_type`: The type of wallet being initialized (e.g., Dev, Marketing),",
        "which dictates the expected schedule length.",
        "* `total_amount`: The total number of tokens to be vested according to the schedule.",
        "* `schedule`: A vector defining the vesting cliffs (release time and amount)."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account, must be a signer and match `ADMIN_PUBKEY`. Pays for account creation."
          ]
        },
        {
          "name": "adminTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The admin's SPL token account, from which tokens will be transferred. Must be mutable."
          ]
        },
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary account (wallet address). Used as a seed for the PDA. Mutable for potential future use.",
            "It is marked mutable because the `init` constraint on `vesting_account` requires the payer (`admin`)",
            "to be mutable, and implicitly, other accounts involved might need to be."
          ]
        },
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA. Initialized by this instruction.",
            "Stores the vesting schedule, beneficiary, mint, amounts, and bump seed.",
            "Seeds: \"vesting\", beneficiary pubkey."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Mint account of the SPL token being vested. Used for type safety and ATA initialization."
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The SPL token account associated with the `vesting_account` PDA. Initialized by this instruction.",
            "This account will hold the tokens being vested.",
            "Authority is automatically set to the `vesting_account` PDA itself via `associated_token::authority`."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Solana System Program, required for creating accounts (`init`)."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for token operations (transfer, ATA init)."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Associated Token Account Program, required for initializing the `vesting_token_account`."
          ]
        }
      ],
      "args": [
        {
          "name": "walletType",
          "type": {
            "defined": "WalletType"
          }
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "schedule",
          "type": {
            "vec": {
              "defined": "VestingSchedule"
            }
          }
        }
      ]
    },
    {
      "name": "claimUnlocked",
      "docs": [
        "Allows the beneficiary (`authority`) to claim tokens that have become unlocked",
        "according to the vesting schedule.",
        "",
        "Tokens are transferred from the vesting PDA's token account to the beneficiary's",
        "specified token account (`destination_token_account`).",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for claiming."
      ],
      "accounts": [
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA containing the schedule and state. Mutable because `claimed_amount` is updated.",
            "`has_one = authority` constraint ensures the `authority` signer matches the one stored in the account."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The beneficiary of the vesting schedule, must be a signer to authorize the claim."
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The PDA's SPL token account holding the vested tokens. Mutable because its balance decreases.",
            "constraint = vesting_token_account.mint == vesting_account.mint,",
            "constraint = vesting_token_account.owner == vesting_signer.key() // Checked manually in handler"
          ]
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary's SPL token account where claimed tokens will be deposited. Mutable because its balance increases.",
            "constraint = destination_token_account.mint == vesting_account.mint @ VestingError::InvalidMint"
          ]
        },
        {
          "name": "vestingSigner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The vesting account PDA, required as the authority for the token transfer CPI.",
            "derived from seeds (`vesting_account.authority`, `vesting_account.bump`) within the handler logic."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for the token transfer CPI."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "adminDistributeUnlocked",
      "docs": [
        "Allows the admin to distribute unlocked tokens to beneficiaries automatically.",
        "",
        "This function enables automated distribution without requiring beneficiaries to manually claim.",
        "Only the designated admin wallet (`ADMIN_PUBKEY`) can call this function.",
        "",
        "Similar to `claim_unlocked`, but can be initiated by the admin on behalf of beneficiaries.",
        "",
        "Args:",
        "* `ctx`: Context containing accounts required for the admin-initiated distribution."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The admin account (must match ADMIN_PUBKEY)"
          ]
        },
        {
          "name": "vestingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vesting account PDA containing the schedule and state. Mutable because `claimed_amount` is updated."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The beneficiary who will receive the tokens"
          ]
        },
        {
          "name": "vestingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The PDA's SPL token account holding the vested tokens. Mutable because its balance decreases."
          ]
        },
        {
          "name": "destinationTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The beneficiary's SPL token account where claimed tokens will be deposited. Mutable because its balance increases."
          ]
        },
        {
          "name": "vestingSigner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The vesting account PDA, required as the authority for the token transfer CPI."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The SPL Token Program, required for the token transfer CPI."
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "vestingAccount",
      "docs": [
        "Represents the state of a vesting schedule stored in the PDA."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The public key of the beneficiary who can claim the tokens. Used in `has_one` and PDA seeds."
            ],
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The mint address of the SPL token being vested."
            ],
            "type": "publicKey"
          },
          {
            "name": "totalAmount",
            "docs": [
              "The total amount of tokens initially locked in the schedule."
            ],
            "type": "u64"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "The amount of tokens already claimed by the beneficiary."
            ],
            "type": "u64"
          },
          {
            "name": "schedule",
            "docs": [
              "The vector containing individual vesting cliffs (time and amount)."
            ],
            "type": {
              "vec": {
                "defined": "VestingSchedule"
              }
            }
          },
          {
            "name": "walletType",
            "docs": [
              "The type of wallet this schedule corresponds to (e.g., Dev, Marketing)."
            ],
            "type": {
              "defined": "WalletType"
            }
          },
          {
            "name": "bump",
            "docs": [
              "The bump seed used for the PDA derivation. Required for CPI signing."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VestingSchedule",
      "docs": [
        "Represents a single vesting cliff in the schedule."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "releaseTime",
            "docs": [
              "The Unix timestamp (seconds since epoch) when the amount becomes unlocked."
            ],
            "type": "u64"
          },
          {
            "name": "amount",
            "docs": [
              "The amount of tokens unlocked at the `release_time`."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "WalletType",
      "docs": [
        "Enum defining different types of vesting schedules (e.g., based on recipient role).",
        "Used to enforce specific schedule lengths during initialization."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Dev"
          },
          {
            "name": "Marketing"
          },
          {
            "name": "Presale1"
          },
          {
            "name": "Presale2"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized: Only the admin can perform this action."
    },
    {
      "code": 6001,
      "name": "InvalidSchedule",
      "msg": "Invalid schedule: Schedule does not meet requirements (length, order, amounts)."
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "Invalid mint: Provided token account mint does not match vesting mint."
    },
    {
      "code": 6003,
      "name": "NothingToClaim",
      "msg": "Nothing to claim: No tokens are currently claimable."
    },
    {
      "code": 6004,
      "name": "InvalidAuthority",
      "msg": "Invalid authority: Signer does not match vesting account authority."
    },
    {
      "code": 6005,
      "name": "InvalidPda",
      "msg": "Invalid PDA: Provided vesting signer account is not the correct PDA."
    },
    {
      "code": 6006,
      "name": "InvalidOwner",
      "msg": "Invalid owner: Vesting token account is not owned by the vesting PDA."
    }
  ]
};
