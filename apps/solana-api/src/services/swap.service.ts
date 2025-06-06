import {
  createJupiterApiClient,
  QuoteGetRequest,
  QuoteResponse,
  SwapInstructionsPostRequest,
  SwapInstructionsResponse,
  SwapResponse
} from '@jup-ag/api'
import {
  Connection,
  PublicKey,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram, // Import ComputeBudgetProgram
  AddressLookupTableAccount,
  TransactionInstruction,
  SystemProgram,
  Transaction, // Ensure Transaction is imported
  BlockhashWithExpiryBlockHeight, // Import for type clarity
  SendTransactionError // Import SendTransactionError
} from '@solana/web3.js'
import dotenv from 'dotenv'
import path from 'path'
import bs58 from 'bs58'
import base64 from 'base64-js'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const SOLANA_RPC_ENDPOINT = process.env.GLOBAL__MAINNET_RPC_URL
if (!SOLANA_RPC_ENDPOINT) {
  throw new Error('Missing GLOBAL__MAINNET_RPC_URL environment variable')
}

const connection = new Connection(SOLANA_RPC_ENDPOINT)
const jupiterApi = createJupiterApiClient() // Default config uses Solana Mainnet

// SPL Token Program IDs (constants instead of imports to avoid ESM/CommonJS issues)
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

/**
 * Fetches a swap quote from the Jupiter API.
 * @param {QuoteGetRequest} quoteRequest - The request parameters for the quote.
 * @returns {Promise<QuoteResponse>} The quote response from Jupiter API.
 */
export const getQuote = async (quoteRequest: QuoteGetRequest): Promise<QuoteResponse> => {
  try {
    const quote = await jupiterApi.quoteGet(quoteRequest)
    if (!quote) {
      throw new Error('Unable to get quote')
    }
    return quote
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get quote: ${error.message}`)
    }
    throw new Error('Failed to get quote due to an unknown error.')
  }
}

/**
 * Generates the swap instructions object using the Jupiter API.
 * NOTE: This transaction needs to be signed by the user's wallet (via main-api)
 * before being sent to the network.
 * @param {PublicKey} userPublicKey - The public key of the user performing the swap.
 * @param {QuoteResponse} quoteResponse - The quote response received from getQuote.
 * @returns {Promise<SwapInstructionsResponse>} The instructions response from Jupiter API.
 */
export const getSwapInstructionsFromJupiter = async (
  userPublicKey: PublicKey,
  quoteResponse: QuoteResponse
): Promise<SwapInstructionsResponse> => {
  try {
    // Construct the payload conforming to SwapInstructionsPostRequest (based on example)
    const instructionsPayload: SwapInstructionsPostRequest = {
      swapRequest: {
        quoteResponse: quoteResponse,
        userPublicKey: userPublicKey.toBase58(),
        dynamicComputeUnitLimit: true // Add dynamic CU limit estimation
        // Optional: Add other parameters like prioritizationFeeLamports: 'auto' if needed
      }
    }

    // Call swapInstructionsPost instead of instructionsPost
    const instructionsResult = await jupiterApi.swapInstructionsPost(instructionsPayload)

    // Return the full instructions result object
    return instructionsResult
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get swap instructions: ${error.message}`)
    }
    throw new Error('Failed to get swap instructions due to an unknown error.')
  }
}

/**
 * Checks if token accounts exist for the given mints and returns instructions if they need to be created.
 * @param userPublicKey - The user's public key
 * @param inputMint - The input token mint
 * @param outputMint - The output token mint
 * @param connection - The Solana connection
 * @returns Information about required token accounts
 */
export const checkRequiredTokenAccounts = async (
  userPublicKey: PublicKey,
  inputMint: PublicKey,
  outputMint: PublicKey,
  connection: Connection
): Promise<{
  needsTokenAccounts: boolean
  missingAccounts: { mint: PublicKey; address: PublicKey }[]
  createAccountInstructions: TransactionInstruction[]
}> => {
  const missingAccounts: { mint: PublicKey; address: PublicKey }[] = []
  const createAccountInstructions: TransactionInstruction[] = []

  // Check input token account
  const sourceTokenAddress = await getAssociatedTokenAddress(inputMint, userPublicKey)

  let sourceExists = false
  try {
    const sourceAccount = await connection.getAccountInfo(sourceTokenAddress)
    sourceExists = !!sourceAccount
  } catch (error) {}

  // Check output token account
  const destinationTokenAddress = await getAssociatedTokenAddress(outputMint, userPublicKey)

  let destinationExists = false
  try {
    const destinationAccount = await connection.getAccountInfo(destinationTokenAddress)
    destinationExists = !!destinationAccount
  } catch (error) {
    console.log(`Error checking output token account: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Create instructions for missing accounts
  if (!sourceExists) {
    missingAccounts.push({ mint: inputMint, address: sourceTokenAddress })
    createAccountInstructions.push(
      createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        sourceTokenAddress,
        userPublicKey, // owner
        inputMint
      )
    )
  }

  if (!destinationExists) {
    missingAccounts.push({ mint: outputMint, address: destinationTokenAddress })
    createAccountInstructions.push(
      createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        destinationTokenAddress,
        userPublicKey, // owner
        outputMint
      )
    )
  }

  const needsTokenAccounts = createAccountInstructions.length > 0

  return {
    needsTokenAccounts,
    missingAccounts,
    createAccountInstructions
  }
}

/**
 * Creates token account transaction for sending to the client.
 * @param createAccountInstructions - The create token account instructions
 * @param userPublicKey - The user's public key
 * @param connection - The Solana connection
 * @returns Transaction that can be sent to the client for signing and submission
 */
export const createTokenAccountTransaction = async (
  createAccountInstructions: TransactionInstruction[],
  userPublicKey: PublicKey,
  connection: Connection
): Promise<{ transaction: Transaction; blockhash: string; lastValidBlockHeight: number }> => {
  // Get blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')

  // Create transaction
  const transaction = new Transaction()
  transaction.recentBlockhash = blockhash

  // IMPORTANT: Set the fee payer to the user's public key
  // The client must sign with this exact same public key or the transaction will fail
  transaction.feePayer = userPublicKey

  // Add token account creation instructions
  for (const instruction of createAccountInstructions) {
    transaction.add(instruction)
  }

  return {
    transaction,
    blockhash,
    lastValidBlockHeight
  }
}

/**
 * Executes the swap transaction.
 * @param {QuoteResponse} quoteResponse - The quote details.
 * @param {string} userPublicKeyString - The public key of the user performing the swap.
 * @param {string} [userPrivateKeyBase64] - The base64 encoded private key of the user.
 * @returns {Promise<string | { requiresTokenAccounts: true; createAccountTransaction: string; missingAccounts: { mint: string; address: string }[] }>} Either the transaction signature or a token account setup request.
 */
export const executeSwapTransaction = async (
  quoteResponse: QuoteResponse,
  userPublicKeyString: string,
  userPrivateKeyBase64?: string
): Promise<
  | string
  | {
      requiresTokenAccounts: true
      createAccountTransaction: string
      missingAccounts: { mint: string; address: string }[]
    }
> => {
  // Use confirmed commitment for better reliability
  const connection = new Connection(process.env.GLOBAL__MAINNET_RPC_URL || '', 'confirmed')
  let userKeypair: Keypair | null = null
  let userPublicKey: PublicKey

  try {
    // Always derive PublicKey from the provided string
    try {
      userPublicKey = new PublicKey(userPublicKeyString)
    } catch (e) {
      throw new Error(`Invalid userPublicKey provided: ${userPublicKeyString}`)
    }

    // Derive keypair only if private key is provided
    if (userPrivateKeyBase64) {
      let privateKeyBytes: Uint8Array | null = null
      try {
        privateKeyBytes = Buffer.from(userPrivateKeyBase64, 'base64')
        // Derive the keypair from the 32-byte seed
        userKeypair = Keypair.fromSeed(privateKeyBytes)
        privateKeyBytes.fill(0) // Clear sensitive data immediately
        privateKeyBytes = null // Dereference

        // Verify derived public key matches the provided one
        if (userKeypair.publicKey.toBase58() !== userPublicKey.toBase58()) {
          throw new Error('Provided userPublicKey does not match the derived public key from the private key.')
        }
      } catch (error) {
        if (privateKeyBytes) privateKeyBytes.fill(0) // Ensure cleanup on error
        throw new Error(
          `Failed to derive or verify keypair: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    } else {
      console.log('No private key provided. Proceeding with public key only for token account checks.')
    }

    // Log the tokens being swapped to help diagnose issues
    if (!quoteResponse.inputMint || !quoteResponse.outputMint) {
      throw new Error('Missing input or output mint in quote response')
    }

    // Check if token accounts exist for both input and output tokens
    const inputMint = new PublicKey(quoteResponse.inputMint)
    const outputMint = new PublicKey(quoteResponse.outputMint)

    const tokenAccountCheck = await checkRequiredTokenAccounts(
      userPublicKey, // Use the derived PublicKey object
      inputMint,
      outputMint,
      connection
    )

    // If token accounts need to be created, return instructions for the client
    if (tokenAccountCheck.needsTokenAccounts) {
      // Create a transaction to create the missing token accounts
      const { transaction } = await createTokenAccountTransaction(
        tokenAccountCheck.createAccountInstructions,
        userPublicKey, // Use the derived PublicKey object
        connection
      )

      // DO NOT sign the transaction - we want the client to sign it
      // Instead, serialize the unsigned transaction
      const serializedTransaction = transaction
        .serialize({ verifySignatures: false, requireAllSignatures: false })
        .toString('base64')

      // Return response indicating token accounts need to be created
      return {
        requiresTokenAccounts: true,
        createAccountTransaction: serializedTransaction,
        missingAccounts: tokenAccountCheck.missingAccounts.map(account => ({
          mint: account.mint.toString(),
          address: account.address.toString()
        }))
      }
    }

    // --- Full Swap Execution Logic ---
    // This part should ONLY run if the private key was provided
    if (!userKeypair) {
      // If accounts exist BUT no private key was provided, we cannot proceed with the swap.
      // This scenario might happen if the client calls again after creating accounts but still without the private key.
      throw new Error('Token accounts are ready, but userPrivateKey is required to sign the swap transaction.')
    }

    // 2. Get swap instructions from Jupiter
    const instructionsResponse = await getSwapInstructionsFromJupiter(userKeypair.publicKey, quoteResponse)
    if (!instructionsResponse) {
      throw new Error('Failed to get swap instructions from Jupiter.')
    }

    // Destructure the instructions response
    const {
      computeBudgetInstructions, // Recommended compute budget instructions
      setupInstructions, // Setup instructions, e.g. OpenATA
      swapInstruction, // The actual swap instruction
      cleanupInstruction, // Cleanup instructions, e.g. CloseATA
      addressLookupTableAddresses // ALT addresses
    } = instructionsResponse

    // 3. Fetch Address Lookup Table Accounts (ALTs)
    const addressLookupTableAccounts = await getAdressLookupTableAccounts(connection, addressLookupTableAddresses)

    // 4. Create Transaction Instructions Array
    // Combine all instructions from Jupiter response
    // Order matters: Compute Budget -> Setup -> Swap -> Cleanup -> Other
    const instructionDataToTransactionInstruction = (instruction: any): TransactionInstruction | null => {
      if (instruction === null || instruction === undefined) return null
      return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key: any) => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable
        })),
        data: Buffer.from(instruction.data, 'base64')
      })
    }

    const instructions: TransactionInstruction[] = [
      ...computeBudgetInstructions.map(instructionDataToTransactionInstruction),
      ...setupInstructions.map(instructionDataToTransactionInstruction),
      instructionDataToTransactionInstruction(swapInstruction),
      instructionDataToTransactionInstruction(cleanupInstruction)
    ].filter((ix): ix is TransactionInstruction => ix !== null)

    // 8. Fetch latest blockhash immediately before sending
    // Re-fetch latest blockhash *just* before sending for maximum validity
    const latestBlockHash = await connection.getLatestBlockhash('confirmed')

    // 9. Compile message and create transaction
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey, // Ensure this is the PublicKey object
      recentBlockhash: latestBlockHash.blockhash,
      instructions // The collected instructions including priority fee
    }).compileToV0Message(addressLookupTableAccounts)

    const transaction = new VersionedTransaction(messageV0)

    // 11. Send the transaction (Removed skipPreflight to see simulation errors)
    transaction.sign([userKeypair])

    const txid = await connection.sendTransaction(transaction, {
      maxRetries: 2 // Retry sending a couple of times if needed
    })

    // 12. Confirm the transaction using the blockhash used for sending
    let confirmationStatus: { value: { err: any | null } } | null = null
    try {
      const confirmationPromise = connection.confirmTransaction(
        {
          signature: txid,
          blockhash: latestBlockHash.blockhash, // Use the same blockhash used to send
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
        },
        'confirmed'
      )

      // Add timeout logic
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timed out after 30 seconds.')), 30000)
      )

      confirmationStatus = await Promise.race([confirmationPromise, timeoutPromise])
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        // Try to get status one last time if timed out
        const lastStatus = await connection.getSignatureStatus(txid, { searchTransactionHistory: false })
        throw new Error(
          `Transaction confirmation timed out. Signature: ${txid}. Last known status: ${lastStatus?.value?.confirmationStatus || 'unknown'}`
        )
      } else {
        throw error
      }
    } finally {
      console.timeEnd(`confirm-${txid}`)
    }

    // Check transaction status from confirmTransaction result
    if (confirmationStatus?.value?.err) {
      // Try to get more details if possible
      if (txid) {
        try {
          const failedTx = await connection.getTransaction(txid, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          })
          console.error('Failed transaction details:', JSON.stringify(failedTx?.meta?.err))
        } catch (txError) {
          console.error('Could not fetch failed transaction details:', txError)
        }
        throw new Error(
          `Transaction failed confirmation: ${JSON.stringify(confirmationStatus.value.err)}. Signature: ${txid}`
        )
      } else {
        throw new Error(`Transaction failed confirmation: ${JSON.stringify(confirmationStatus.value.err)}`)
      }
    } else if (confirmationStatus) {
      // If err is null, the transaction reached 'confirmed' commitment.
      console.log(`Transaction successfully confirmed. Signature: ${txid}`)
    } else {
      // Should not happen if timeout error is caught correctly, but as a safeguard
      throw new Error('Transaction confirmation status unclear after process completed.')
    }
    return txid // Return the transaction signature upon successful confirmation
  } catch (error: any) {
    // Clear keypair if it exists in case of error
    // Note: privateKeyBytes should already be cleared
    userKeypair = null
    if (error instanceof Error) {
      // Re-throw the original error message for clarity
      throw new Error(`Swap execution failed: ${error.message}`)
    } else {
      // Throw a generic message for non-Error types
      throw new Error(`Swap execution failed due to an unknown error.`)
    }
  }
} // End of executeSwapTransaction

/**
 * Get the associated token address for a given mint and owner.
 */
async function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return address
}

/**
 * Create an instruction to create an associated token account if one doesn't exist.
 */
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedTokenAddress: PublicKey, // Renamed for clarity
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    // Rent sysvar is implicitly passed via Solana runtime V1.10+
    // { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
  ]

  // The Associated Token Account Program does not require data for the create instruction
  const data = Buffer.alloc(0)

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data
  })
}

/**
 * Helper function to get or create an associated token account
 * Creates the token account if it doesn't exist
 */
async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; created: boolean }> {
  // Get the associated token address
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner)

  try {
    // Check if the account exists
    const tokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress)

    if (tokenAccountInfo) {
      return { address: associatedTokenAddress, created: false }
    }
  } catch (error) {
    console.log(`Will attempt to create the token account`)
  }

  try {
    // Create the instruction to create an associated token account
    const instructions = [
      // This uses the system program to create a new account associated with the token mint
      createAssociatedTokenAccountInstruction(
        payer.publicKey, // payer
        associatedTokenAddress, // associated token account address
        owner, // owner
        mint // mint
      )
    ]

    // Create a transaction with the instruction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')

    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payer.publicKey
    transaction.add(...instructions)

    // Sign the transaction with the keypair - this is critical
    transaction.sign(payer)

    // Send the transaction with higher retry count
    const signature = await connection.sendTransaction(transaction, [payer], {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5
    })

    // Wait for confirmation with proper error handling
    try {
      const status = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight
        },
        'confirmed'
      )

      if (status.value.err) {
        throw new Error(`Failed to create token account: ${JSON.stringify(status.value.err)}`)
      }

      // Double check that the account was created
      const confirmedAccount = await connection.getAccountInfo(associatedTokenAddress)
      if (!confirmedAccount) {
        console.warn(
          `Warning: Token account ${associatedTokenAddress.toString()} doesn't seem to be created despite successful transaction`
        )
      } else {
        console.log(
          `Confirmed: Token account ${associatedTokenAddress.toString()} exists with size: ${confirmedAccount.data.length} bytes`
        )
      }

      return { address: associatedTokenAddress, created: true }
    } catch (confirmError) {
      // Check if the account was created anyway (sometimes confirmations fail but transactions succeed)
      try {
        const accountInfo = await connection.getAccountInfo(associatedTokenAddress)
        if (accountInfo) {
          return { address: associatedTokenAddress, created: true }
        }
      } catch (e) {
        // Ignore this error
      }

      throw new Error(
        `Failed to confirm token account creation: ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`
      )
    }
  } catch (error) {
    // One last check before giving up - maybe it was created in a previous attempt
    try {
      const accountInfo = await connection.getAccountInfo(associatedTokenAddress)
      if (accountInfo) {
        return { address: associatedTokenAddress, created: true }
      }
    } catch (e) {
      // Ignore this error
    }

    throw new Error(`Failed to create token account: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Helper function to fetch Address Lookup Table Accounts (ALTs)
 */
async function getAdressLookupTableAccounts(
  connection: Connection,
  addresses: string[]
): Promise<AddressLookupTableAccount[]> {
  const tables: AddressLookupTableAccount[] = []
  for (const addr of addresses) {
    try {
      const res = await connection.getAddressLookupTable(new PublicKey(addr))
      if (res.value !== null) {
        tables.push(res.value)
      } else {
        console.warn(`ALT not found on RPC: ${addr}`)
      }
    } catch (err) {
      console.error(`Error fetching ALT ${addr}:`, err)
    }
  }
  return tables
}

/**
 * Submits a signed token account transaction to the Solana network
 * @param serializedTransaction - The base64 encoded signed transaction
 * @param blockhash - The blockhash used for this transaction (not needed since it's in the transaction)
 * @param connection - The Solana connection
 * @returns - The transaction signature
 */
export const submitTokenAccountTransaction = async (serializedTransaction: string): Promise<string> => {
  // Use confirmed commitment for better reliability
  const connection = new Connection(process.env.GLOBAL__MAINNET_RPC_URL || '', 'confirmed')
  let backupConnection: Connection | null = null

  // Declare variables here to be accessible in both try and catch blocks
  let originalBlockhashForConfirmation: string | undefined
  let originalLastValidBlockHeightForConfirmation: number | undefined

  if (process.env.GLOBAL__BACKUP_RPC_URL) {
    backupConnection = new Connection(process.env.GLOBAL__BACKUP_RPC_URL, 'confirmed')
  }

  try {
    // Deserialize the transaction from base64
    const transactionBuffer = Buffer.from(serializedTransaction, 'base64')

    // --- Development-only: simulate transaction to catch obvious issues before submit ---
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Attempt to deserialize as legacy first, then versioned
        let legacyTx: Transaction
        let originalBlockhash: string
        let originalLastValidBlockHeight: number | undefined

        try {
          legacyTx = Transaction.from(transactionBuffer)
          originalBlockhash = legacyTx.recentBlockhash!
          originalLastValidBlockHeight = legacyTx.lastValidBlockHeight
        } catch (e) {
          // If legacy fails, try versioned
          const versionedTx = VersionedTransaction.deserialize(transactionBuffer)
          originalBlockhash = versionedTx.message.recentBlockhash
          // lastValidBlockHeight is not directly available on VersionedTransaction message prior to signing
          // but it's embedded in the blockhash. confirmTransaction will use it.
          // Solana's `confirmTransaction` can often derive `lastValidBlockHeight` from `blockhash` if it's a `BlockhashWithExpiryBlockHeight` object.
          // Let's try to get it from parsing the blockhash, or if not, fetch from connection using the default or 'confirmed' commitment.
          // const blockhashDetails = await connection.getBlockHeight(originalBlockhash); // This call was causing a lint error if a second arg string was passed.
          // We don't strictly need blockhashDetails here as confirmTransaction is robust with the original blockhash.
          // The logic below fetches lastValidBlockHeight based on whether the originalBlockhashForConfirmation is still the latest.
          originalLastValidBlockHeight = undefined
        }

        // If legacyTx exists and has lastValidBlockHeight, use it for simulation context
        const simTxToUse = Transaction.from(transactionBuffer) // Re-deserialize for simulation to be safe

        const simResult = await connection.simulateTransaction(simTxToUse, undefined, true)
        if (simResult.value.err) {
          console.error('Preflight simulation failed:', JSON.stringify(simResult.value.err))
          if (simResult.value.logs) {
            simResult.value.logs.forEach(log => console.error('sim log:', log))
          }
        } else {
          console.log('Preflight simulation succeeded')
        }
      } catch (simErr) {
        console.warn('Simulation attempt threw error:', simErr instanceof Error ? simErr.message : String(simErr))
      }
    }

    // Extract original blockhash and lastValidBlockHeight from the transaction for confirmation
    try {
      // Try deserializing as a legacy Transaction first
      const legacyTransaction = Transaction.from(transactionBuffer)
      if (!legacyTransaction.recentBlockhash) {
        throw new Error('recentBlockhash not found in legacy transaction')
      }
      originalBlockhashForConfirmation = legacyTransaction.recentBlockhash
      if (legacyTransaction.lastValidBlockHeight === undefined) {
        // If lastValidBlockHeight is not on the legacy tx, derive from a getFeeForMessage call with the blockhash
        // This is a fallback; ideally, the client includes it or we parse it carefully from versioned if applicable.
        // For now, we'll fetch it based on the blockhash if not present.
        // This part might need refinement based on how client constructs legacy TX.
        console.warn('lastValidBlockHeight not found on legacy transaction, fetching using blockhash. Client should include this.')
        const feeForMessage = await connection.getFeeForMessage(legacyTransaction.compileMessage(), 'confirmed')
        if (!feeForMessage || !feeForMessage.context || !feeForMessage.context.slot) {
          throw new Error('Could not determine lastValidBlockHeight from legacy transaction blockhash.')
        }
        // A common heuristic: lastValidBlockHeight is often blockhash expiry block height, which is ~300 blocks from current.
        // The most reliable way is if the client provides it, or we derive it from the blockhash string itself if it's a new format blockhash.
        // For this fix, we rely on confirmTransaction's internal logic given the correct blockhash, or this fetch.
        // Solana's `confirmTransaction` can often derive `lastValidBlockHeight` from `blockhash` if it's a `BlockhashWithExpiryBlockHeight` object.
        // Let's try to get it from parsing the blockhash, or if not, fetch from connection using the default or 'confirmed' commitment.
        // const blockhashDetails = await connection.getBlockHeight(originalBlockhashForConfirmation); // This call was causing a lint error if a second arg string was passed.
        // We don't strictly need blockhashDetails here as confirmTransaction is robust with the original blockhash.
        // The logic below fetches lastValidBlockHeight based on whether the originalBlockhashForConfirmation is still the latest.
        originalLastValidBlockHeightForConfirmation = feeForMessage.context.slot
      } else {
        originalLastValidBlockHeightForConfirmation = legacyTransaction.lastValidBlockHeight
      }
    } catch (e) {
      // If legacy fails, assume it's a VersionedTransaction
      const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
      originalBlockhashForConfirmation = versionedTransaction.message.recentBlockhash
      // For VersionedTransaction, lastValidBlockHeight is implicitly handled by the library
      // when confirming with the blockhash. We need to fetch a current one for the confirmation parameters.
      // The key is that `originalBlockhashForConfirmation` (from the tx) is passed to `confirmTransaction`.
      const latestBlockhashInfo = await connection.getLatestBlockhash('confirmed')
      originalLastValidBlockHeightForConfirmation = latestBlockhashInfo.lastValidBlockHeight
      console.log(`Using original blockhash ${originalBlockhashForConfirmation} and current lastValidBlockHeight ${originalLastValidBlockHeightForConfirmation} for VersionedTransaction confirmation.`)
    }

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transactionBuffer, {
      skipPreflight: false, // Keep preflight for safety unless specific reason to skip
      preflightCommitment: 'confirmed',
      maxRetries: 5
    })

    console.log(`Token account transaction sent, signature: ${signature}, using original blockhash: ${originalBlockhashForConfirmation} for confirmation.`)

    // Wait for confirmation using the original blockhash and lastValidBlockHeight from the transaction
    try {
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: originalBlockhashForConfirmation, // Use the blockhash from the client's transaction
          lastValidBlockHeight: originalLastValidBlockHeightForConfirmation // Use the LVBH from the client's transaction
        },
        'confirmed'
      )

      if (confirmation.value.err) {
        console.error(`Token account creation failed after confirmation: ${JSON.stringify(confirmation.value.err)}`, `Signature: ${signature}`)
        throw new Error(`Failed to create token account: ${JSON.stringify(confirmation.value.err)}`)
      }
      console.log(`Token account(s) created successfully, tx: ${signature}`)
      return signature
    } catch (confirmError) {
      console.error(
        `Error confirming token account transaction (sig: ${signature}): ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`
      )

      // Check if backup connection exists and try that
      if (backupConnection) {
        console.log(`Attempting confirmation with backup RPC for signature: ${signature}`)
        try {
          // For backup, still use original blockhash details
          if (originalBlockhashForConfirmation && typeof originalLastValidBlockHeightForConfirmation === 'number') {
            const backupConfirmation = await backupConnection.confirmTransaction(
              {
                signature,
                blockhash: originalBlockhashForConfirmation,
                lastValidBlockHeight: originalLastValidBlockHeightForConfirmation
              },
              'confirmed'
            )

            if (!backupConfirmation.value.err) {
              console.log(`Successfully confirmed token account(s) with backup RPC, tx: ${signature}`)
              return signature
            }
          } else {
            console.error('Backup RPC: Cannot attempt confirmation because original blockhash details are missing. Throwing original error.');
            // If original blockhash details weren't even extracted, re-throw the original error as backup confirmation isn't possible.
          }
        } catch (backupConfirmError) {
          console.error(
            `Backup RPC confirmation also failed (sig: ${signature}): ${backupConfirmError instanceof Error ? backupConfirmError.message : String(backupConfirmError)}`
          )
        }
      }

      throw new Error(
        `Failed to confirm token account creation (sig: ${signature}): ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`
      )
    }
  } catch (error) {
    console.error(
      `Error submitting token account transaction: ${error instanceof Error ? error.message : String(error)}`
    )

    // Try backup RPC if available and this is a network error (e.g. submission failed)
    if (backupConnection && error instanceof Error && (error.message.includes('network') || error.message.includes('failed to send'))) {
      console.log('Outer catch: Trying backup RPC endpoint for sendRawTransaction...')
      try {
        const transactionBuffer = Buffer.from(serializedTransaction, 'base64') // re-buffer
        // Re-attempt sendRawTransaction with backup
        const backupSignature = await backupConnection.sendRawTransaction(transactionBuffer, {
          skipPreflight: false, // Keep preflight
          preflightCommitment: 'confirmed',
          maxRetries: 3 // Fewer retries for backup
        })
        console.log(`Transaction sent via backup RPC, signature: ${backupSignature}`)

        // Attempt confirmation with backup (using original blockhash details)
        if (originalBlockhashForConfirmation && typeof originalLastValidBlockHeightForConfirmation === 'number') {
          const backupConfirmation = await backupConnection.confirmTransaction(
            {
              signature: backupSignature,
              blockhash: originalBlockhashForConfirmation, // Now type-safe
              lastValidBlockHeight: originalLastValidBlockHeightForConfirmation // Now type-safe
            },
            'confirmed'
          )

          if (backupConfirmation.value.err) {
            console.error(`Backup RPC: Token account creation failed after confirmation: ${JSON.stringify(backupConfirmation.value.err)}`)
            // Fall through to throw original error if backup confirmation also fails
          } else {
            console.log(`Backup RPC: Token account(s) created successfully, tx: ${backupSignature}`)
            return backupSignature // Success via backup
          }
        } else {
          console.error('Backup RPC: Cannot attempt confirmation because original blockhash details are missing. Throwing original error.');
          // If original blockhash details weren't even extracted, re-throw the original error as backup confirmation isn't possible.
        }
      } catch (backupError) {
        console.error(
          `Backup RPC attempt failed: ${backupError instanceof Error ? backupError.message : String(backupError)}`
        )
        // Fall through to throw original error if backup also fails
      }
    }

    // If it's a SendTransactionError from the primary connection, try to get more details
    if (error instanceof SendTransactionError) {
      console.error('Detailed SendTransactionError Information:')
      if (error.logs && error.logs.length > 0) {
        error.logs.forEach((log, i) => console.error(`Log[${i}]: ${log}`))
      } else {
        console.error('No specific logs found on SendTransactionError. Attempting to fetch via getLogs().')
        // The getLogs method might not be available directly on all SendTransactionError instances
        // or might require the connection object. Web3.js error handling can be nuanced.
        // This is a best-effort attempt.
        if (typeof (error as any).getLogs === 'function') {
          try {
            // Assuming 'connection' is the primary connection object in scope
            const logs = await (error as any).getLogs(connection)
            if (logs) {
              console.error("Solana SendTransactionError On-Chain Logs:", logs)
            }
          } catch (logErr) {
            console.error("Failed to retrieve SendTransactionError on-chain logs:", logErr)
          }
        }
      }
    }

    throw error // Re-throw the original error after logging and backup attempt
  }
}
