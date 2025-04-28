import { createJupiterApiClient, QuoteGetRequest, QuoteResponse, SwapInstructionsPostRequest, SwapInstructionsResponse, SwapResponse } from '@jup-ag/api';
import {
    Connection,
    PublicKey,
    Keypair,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    AddressLookupTableAccount,
    TransactionInstruction,
    SystemProgram,
    Transaction,
    sendAndConfirmRawTransaction,
} from '@solana/web3.js';
import dotenv from 'dotenv';
import path from 'path';
import bs58 from 'bs58';
import base64 from 'base64-js';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const SOLANA_RPC_ENDPOINT = process.env.GLOBAL__MAINNET_RPC_URL;
if (!SOLANA_RPC_ENDPOINT) {
    throw new Error("Missing GLOBAL__MAINNET_RPC_URL environment variable");
}

const connection = new Connection(SOLANA_RPC_ENDPOINT);
const jupiterApi = createJupiterApiClient(); // Default config uses Solana Mainnet

// SPL Token Program IDs (constants instead of imports to avoid ESM/CommonJS issues)
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/**
 * Fetches a swap quote from the Jupiter API.
 * @param {QuoteGetRequest} quoteRequest - The request parameters for the quote.
 * @returns {Promise<QuoteResponse>} The quote response from Jupiter API.
 */
export const getQuote = async (quoteRequest: QuoteGetRequest): Promise<QuoteResponse> => {
    try {
        console.log('Fetching quote with params:', quoteRequest);
        const quote = await jupiterApi.quoteGet(quoteRequest);
        console.log('Received quote:', quote);
        if (!quote) {
            throw new Error("Unable to get quote");
        }
        return quote;
    } catch (error) {
        console.error("Error getting quote:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to get quote: ${error.message}`);
        }
        throw new Error("Failed to get quote due to an unknown error.");
    }
};

/**
 * Generates the swap instructions object using the Jupiter API.
 * NOTE: This transaction needs to be signed by the user's wallet (via main-api)
 * before being sent to the network.
 * @param {PublicKey} userPublicKey - The public key of the user performing the swap.
 * @param {QuoteResponse} quoteResponse - The quote response received from getQuote.
 * @returns {Promise<SwapInstructionsResponse>} The instructions response from Jupiter API.
 */
export const getSwapInstructionsFromJupiter = async (userPublicKey: PublicKey, quoteResponse: QuoteResponse): Promise<SwapInstructionsResponse> => {
    try {
        console.log('Getting swap instructions for user:', userPublicKey.toBase58());

        // Construct the payload conforming to SwapInstructionsPostRequest (based on example)
        const instructionsPayload: SwapInstructionsPostRequest = { 
          swapRequest: { // Fix: Use nested 'swapRequest' object
            quoteResponse: quoteResponse,
            userPublicKey: userPublicKey.toBase58(),
            // Optional: Add other parameters like prioritizationFeeLamports: 'auto' if needed
          }
        };

        console.log('Instructions request payload:', instructionsPayload);
        // Call swapInstructionsPost instead of instructionsPost
        const instructionsResult = await jupiterApi.swapInstructionsPost(instructionsPayload);
        console.log('Received swap instructions data:', instructionsResult);

        // Return the full instructions result object
        return instructionsResult;

    } catch (error) {
        console.error("Error getting swap instructions:", error);
         if (error instanceof Error) {
             throw new Error(`Failed to get swap instructions: ${error.message}`);
        }
        throw new Error("Failed to get swap instructions due to an unknown error.");
    }
};

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
  needsTokenAccounts: boolean;
  missingAccounts: { mint: PublicKey; address: PublicKey }[];
  createAccountInstructions: TransactionInstruction[];
}> => {
  console.log(`Checking required token accounts for input mint ${inputMint.toString()} and output mint ${outputMint.toString()}`);
  
  const missingAccounts: { mint: PublicKey; address: PublicKey }[] = [];
  const createAccountInstructions: TransactionInstruction[] = [];
  
  // Check input token account
  const sourceTokenAddress = await getAssociatedTokenAddress(inputMint, userPublicKey);
  console.log(`Checking input token account: ${sourceTokenAddress.toString()}`);
  
  let sourceExists = false;
  try {
    const sourceAccount = await connection.getAccountInfo(sourceTokenAddress);
    sourceExists = !!sourceAccount;
    console.log(`Input token account ${sourceExists ? 'exists' : 'does not exist'}`);
  } catch (error) {
    console.log(`Error checking input token account: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check output token account
  const destinationTokenAddress = await getAssociatedTokenAddress(outputMint, userPublicKey);
  console.log(`Checking output token account: ${destinationTokenAddress.toString()}`);
  
  let destinationExists = false;
  try {
    const destinationAccount = await connection.getAccountInfo(destinationTokenAddress);
    destinationExists = !!destinationAccount;
    console.log(`Output token account ${destinationExists ? 'exists' : 'does not exist'}`);
  } catch (error) {
    console.log(`Error checking output token account: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Create instructions for missing accounts
  if (!sourceExists) {
    console.log(`Adding instruction to create input token account for mint ${inputMint.toString()}`);
    missingAccounts.push({ mint: inputMint, address: sourceTokenAddress });
    createAccountInstructions.push(
      createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        sourceTokenAddress,
        userPublicKey, // owner
        inputMint
      )
    );
  }
  
  if (!destinationExists) {
    console.log(`Adding instruction to create output token account for mint ${outputMint.toString()}`);
    missingAccounts.push({ mint: outputMint, address: destinationTokenAddress });
    createAccountInstructions.push(
      createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        destinationTokenAddress,
        userPublicKey, // owner
        outputMint
      )
    );
  }
  
  const needsTokenAccounts = createAccountInstructions.length > 0;
  
  return {
    needsTokenAccounts,
    missingAccounts,
    createAccountInstructions
  };
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
  console.log(`Creating token account transaction with ${createAccountInstructions.length} instructions`);
  
  // Get blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  console.log(`Using blockhash: ${blockhash}, lastValidBlockHeight: ${lastValidBlockHeight}`);
  
  // Create transaction
  const transaction = new Transaction();
  transaction.recentBlockhash = blockhash;
  
  // IMPORTANT: Set the fee payer to the user's public key
  // The client must sign with this exact same public key or the transaction will fail
  transaction.feePayer = userPublicKey;
  console.log(`Setting fee payer to: ${userPublicKey.toString()}`);
  
  // Add token account creation instructions
  for (const instruction of createAccountInstructions) {
    transaction.add(instruction);
  }
  
  return {
    transaction,
    blockhash,
    lastValidBlockHeight
  };
}

/**
 * Executes the swap transaction.
 * @param {QuoteResponse} quoteResponse - The quote details.
 * @param {string} userPrivateKeyBase64 - The base64 encoded private key of the user.
 * @returns {Promise<string | { requiresTokenAccounts: true; createAccountTransaction: string; missingAccounts: { mint: string; address: string }[] }>} Either the transaction signature or a token account setup request.
 */
export const executeSwapTransaction = async (
  quoteResponse: QuoteResponse,
  userPrivateKeyBase64: string
): Promise<string | { requiresTokenAccounts: true; createAccountTransaction: string; missingAccounts: { mint: string; address: string }[] }> => { 
  // Use confirmed commitment for better reliability
  const connection = new Connection(process.env.GLOBAL__MAINNET_RPC_URL || '', 'confirmed');
  let privateKeyBytes: Uint8Array;
  let userKeypair: Keypair;

  try {
    console.log("Executing swap transaction using instructions...");
    privateKeyBytes = base64.toByteArray(userPrivateKeyBase64);
    userKeypair = Keypair.fromSecretKey(privateKeyBytes);
    const userPublicKey = userKeypair.publicKey;
    privateKeyBytes.fill(0); // Clear sensitive data after use

    // Log the tokens being swapped to help diagnose issues
    if (!quoteResponse.inputMint || !quoteResponse.outputMint) {
      throw new Error("Missing input or output mint in quote response");
    }
    
    console.log(`Attempting to swap from ${quoteResponse.inputMint} to ${quoteResponse.outputMint}`);
    
    // Check if token accounts exist for both input and output tokens
    const inputMint = new PublicKey(quoteResponse.inputMint);
    const outputMint = new PublicKey(quoteResponse.outputMint);
    
    const tokenAccountCheck = await checkRequiredTokenAccounts(
      userPublicKey,
      inputMint,
      outputMint,
      connection
    );
    
    // If token accounts need to be created, return instructions for the client
    if (tokenAccountCheck.needsTokenAccounts) {
      console.log(`Missing ${tokenAccountCheck.missingAccounts.length} token accounts, requesting creation first`);
      
      // Create a transaction to create the missing token accounts
      const { transaction } = await createTokenAccountTransaction(
        tokenAccountCheck.createAccountInstructions,
        userPublicKey,
        connection
      );
      
      // DO NOT sign the transaction - we want the client to sign it
      // Instead, serialize the unsigned transaction
      const serializedTransaction = transaction.serialize({ verifySignatures: false, requireAllSignatures: false }).toString('base64');
      
      // Return response indicating token accounts need to be created
      return {
        requiresTokenAccounts: true,
        createAccountTransaction: serializedTransaction,
        missingAccounts: tokenAccountCheck.missingAccounts.map(account => ({
          mint: account.mint.toString(),
          address: account.address.toString()
        }))
      };
    }

    // 2. Get swap instructions from Jupiter
    const instructionsResponse = await getSwapInstructionsFromJupiter(userKeypair.publicKey, quoteResponse);
    if (!instructionsResponse) {
      throw new Error("Failed to get swap instructions from Jupiter.");
    }

    // Enhanced logging for swap instructions
    console.log("Received swap instructions with ALT count:", instructionsResponse.addressLookupTableAddresses?.length || 0);
    
    // Destructure the instructions response
    const { 
      computeBudgetInstructions, // Recommended compute budget instructions
      setupInstructions,         // Setup instructions, e.g. OpenATA
      swapInstruction,           // The actual swap instruction
      cleanupInstruction,        // Cleanup instructions, e.g. CloseATA
      addressLookupTableAddresses // ALT addresses
    } = instructionsResponse;

    // 3. Fetch Address Lookup Table Accounts (ALTs)
    console.log("Fetching ALTs...");
    const addressLookupTableAccounts = await getAdressLookupTableAccounts(
      connection, 
      addressLookupTableAddresses
    );
    console.log(`Fetched ${addressLookupTableAccounts.length} ALTs.`);

    // 4. Create Transaction Instructions Array
    // Add additional compute budget instruction for higher priority
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50_000_000 // 50 lamports per CU - high priority
    });
    
    const computeUnitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_400_000 // Maximum compute units
    });
    
    // Let Jupiter handle other compute budget instructions
    const instructions: TransactionInstruction[] = [
      // Add our high priority compute budget instructions first
      priorityFeeInstruction,
      computeUnitInstruction,
      ...computeBudgetInstructions.map(instructionDataToTransactionInstruction),
      ...setupInstructions.map(instructionDataToTransactionInstruction),
      instructionDataToTransactionInstruction(swapInstruction),
      instructionDataToTransactionInstruction(cleanupInstruction),
    ].filter((ix): ix is TransactionInstruction => ix !== null);

    if (instructions.length === 0) {
        throw new Error("No instructions found for swap.");
    }
    
    console.log(`Built transaction with ${instructions.length} instructions`);

    // 5. Get Latest Blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    console.log(`Using blockhash: ${blockhash}`);

    // 6. Compile Transaction Message
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    // 7. Create and Sign Versioned Transaction
    const transaction = new VersionedTransaction(messageV0);
    console.log("Signing transaction...");
    transaction.sign([userKeypair]);

    // 8. Send Transaction with high priority
    console.log("Sending transaction...");
    const rawTransaction = transaction.serialize();
    
    // Add higher priority with explicit compute budget configuration
    const highPriorityOptions = {
      skipPreflight: true,
      maxRetries: 30,
      preflightCommitment: 'processed' as 'processed',
      minContextSlot: quoteResponse.contextSlot || undefined
    };

    // Try sending the transaction
    let txid = '';
    try {
      txid = await connection.sendRawTransaction(rawTransaction, highPriorityOptions);
      console.log(`Transaction sent. Signature: ${txid}`);
    } catch (sendError: any) {
      console.error('Error sending transaction:', sendError);
      
      // If primary RPC fails, try backup RPCs if available
      if (process.env.GLOBAL__BACKUP_RPC_URL) {
        console.log('Trying backup RPC endpoint...');
        try {
          const backupConnection = new Connection(process.env.GLOBAL__BACKUP_RPC_URL, 'confirmed');
          txid = await backupConnection.sendRawTransaction(rawTransaction, highPriorityOptions);
          console.log(`Transaction sent via backup RPC. Signature: ${txid}`);
        } catch (backupError) {
          console.error('Backup RPC send failed:', backupError);
          throw new Error(`Failed to send transaction: ${sendError.message}`);
        }
      } else {
        throw sendError;
      }
    }

    // 9. Poll for transaction status with timeout and increased frequency
    console.log(`Confirming transaction: ${txid}`);
    let status = null;
    const startTime = Date.now();
    const maxRetries = 10;
    const interval = 1000; // Check every 1 second
    const timeout = 10000; // 10 seconds total timeout
    
    while (Date.now() - startTime < timeout) {
      try {
        status = await connection.getSignatureStatus(txid, { searchTransactionHistory: true });
        console.log(`Status check: ${JSON.stringify(status?.value?.confirmationStatus || 'pending')}`);
        
        if (status?.value) {
          if (status.value.err) {
            console.error('Transaction error:', status.value.err);
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          }
          
          if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
            console.log(`Transaction confirmed with status: ${status.value.confirmationStatus}`);
            return txid;
          }
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.warn('Error checking transaction status:', error);
        // Continue polling despite errors
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Final check after timeout
    status = await connection.getSignatureStatus(txid, { searchTransactionHistory: true });
    if (status?.value && !status.value.err && 
       (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized')) {
      console.log(`Transaction confirmed on final check with status: ${status.value.confirmationStatus}`);
      return txid;
    }
    
    throw new Error(`Transaction confirmation timed out after ${timeout/1000} seconds. Final status: ${JSON.stringify(status?.value?.confirmationStatus || 'unknown')}`);

  } catch (error: any) {
    console.error('Error executing swap transaction:', error);
    if (error instanceof Error) {
      // Log specific Jupiter API errors if available
      if ('response' in error && typeof error.response === 'object' && error.response !== null && 'json' in error.response && typeof error.response.json === 'function') {
        try {
          const errDetails = await (error as any).response.json();
          console.error('Jupiter API Error Details:', errDetails);
        } catch (jsonError) {
          console.error('Failed to parse error response JSON');
        }
      }
      throw new Error(`Failed to execute swap transaction: ${error.message}`);
    }
    throw new Error('Failed to execute swap transaction due to an unknown error.');
  }
};

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
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
  console.log(`Checking token account ${associatedTokenAddress.toString()} for mint ${mint.toString()}`);
  
  try {
    // Check if the account exists
    const tokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress);
    
    if (tokenAccountInfo) {
      console.log(`Token account ${associatedTokenAddress.toString()} already exists, size: ${tokenAccountInfo.data.length} bytes`);
      return { address: associatedTokenAddress, created: false };
    }
    
    console.log(`Token account ${associatedTokenAddress.toString()} doesn't exist, creating now...`);
  } catch (error) {
    console.log(`Error checking token account: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`Will attempt to create the token account`);
  }

  // Token account doesn't exist, create it
  console.log(`Creating token account ${associatedTokenAddress.toString()} for mint ${mint.toString()}`);
  
  try {
    // Create the instruction to create an associated token account
    const instructions = [
      // This uses the system program to create a new account associated with the token mint
      createAssociatedTokenAccountInstruction(
        payer.publicKey,      // payer
        associatedTokenAddress, // associated token account address
        owner,                // owner
        mint                  // mint
      )
    ];

    // Create a transaction with the instruction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    console.log(`Using blockhash: ${blockhash}, lastValidBlockHeight: ${lastValidBlockHeight}`);
    
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.add(...instructions);

    // Sign the transaction with the keypair - this is critical
    transaction.sign(payer);

    // Send the transaction with higher retry count
    console.log(`Sending token account creation transaction...`);
    const signature = await connection.sendTransaction(transaction, [payer], {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5
    });
    
    console.log(`Token account creation transaction sent: ${signature}`);

    // Wait for confirmation with proper error handling
    try {
      const status = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight
        },
        'confirmed'
      );
      
      if (status.value.err) {
        console.error(`Token account creation failed: ${JSON.stringify(status.value.err)}`);
        throw new Error(`Failed to create token account: ${JSON.stringify(status.value.err)}`);
      }
      
      console.log(`Successfully created token account ${associatedTokenAddress.toString()}`);
      
      // Double check that the account was created
      const confirmedAccount = await connection.getAccountInfo(associatedTokenAddress);
      if (!confirmedAccount) {
        console.warn(`Warning: Token account ${associatedTokenAddress.toString()} doesn't seem to be created despite successful transaction`);
      } else {
        console.log(`Confirmed: Token account ${associatedTokenAddress.toString()} exists with size: ${confirmedAccount.data.length} bytes`);
      }
      
      return { address: associatedTokenAddress, created: true };
    } catch (confirmError) {
      console.error(`Error confirming token account creation: ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`);
      
      // Check if the account was created anyway (sometimes confirmations fail but transactions succeed)
      try {
        const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
        if (accountInfo) {
          console.log(`Token account ${associatedTokenAddress.toString()} exists despite confirmation error`);
          return { address: associatedTokenAddress, created: true };
        }
      } catch (e) {
        // Ignore this error
      }
      
      throw new Error(`Failed to confirm token account creation: ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`);
    }
  } catch (error) {
    console.error(`Error creating token account: ${error instanceof Error ? error.message : String(error)}`);
    
    // One last check before giving up - maybe it was created in a previous attempt
    try {
      const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
      if (accountInfo) {
        console.log(`Token account ${associatedTokenAddress.toString()} exists despite errors`);
        return { address: associatedTokenAddress, created: true };
      }
    } catch (e) {
      // Ignore this error
    }
    
    throw new Error(`Failed to create token account: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create an instruction to create an associated token account
 */
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(0);
  
  // Layout for the keys in the Associated Token Account instruction
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // Rent sysvar can be skipped in newer Solana versions since its accessed via the SysvarRent address
    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data,
  });
}

/**
 * Get the associated token address
 */
async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const [address] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

// Helper function to convert InstructionData received from Jupiter API to TransactionInstruction
function instructionDataToTransactionInstruction(instruction: any | undefined | null): TransactionInstruction | null {
  if (instruction === null || instruction === undefined) return null;
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, 'base64'),
  });
}

// Helper function to fetch Address Lookup Table Accounts (ALTs)
async function getAdressLookupTableAccounts(
    connection: Connection,
    addresses: string[]
): Promise<AddressLookupTableAccount[]> {
    const tables: AddressLookupTableAccount[] = [];
    for (const addr of addresses) {
        try {
            const res = await connection.getAddressLookupTable(new PublicKey(addr));
            if (res.value !== null) {
                tables.push(res.value);
            } else {
                console.warn(`ALT not found on RPC: ${addr}`);
            }
        } catch (err) {
            console.error(`Error fetching ALT ${addr}:`, err);
        }
    }
    return tables;
}

/**
 * Submits a signed token account transaction to the Solana network
 * @param serializedTransaction - The base64 encoded signed transaction
 * @param blockhash - The blockhash used for this transaction (not needed since it's in the transaction)
 * @param connection - The Solana connection
 * @returns - The transaction signature
 */
export const submitTokenAccountTransaction = async (
  serializedTransaction: string
): Promise<string> => {
  console.log('Submitting token account creation transaction that was signed by the client');
  
  // Use confirmed commitment for better reliability
  const connection = new Connection(process.env.GLOBAL__MAINNET_RPC_URL || '', 'confirmed');
  let backupConnection: Connection | null = null;
  
  if (process.env.GLOBAL__BACKUP_RPC_URL) {
    backupConnection = new Connection(process.env.GLOBAL__BACKUP_RPC_URL, 'confirmed');
  }
  
  try {
    // Deserialize the transaction from base64
    const transactionBuffer = Buffer.from(serializedTransaction, 'base64');
    
    // Send and confirm transaction
    console.log('Sending token account transaction...');
    const signature = await connection.sendRawTransaction(transactionBuffer, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5
    });
    
    console.log(`Token account transaction sent: ${signature}`);
    
    // Confirm transaction with timeout
    console.log(`Confirming token account transaction: ${signature}`);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // Wait for confirmation with timeout
    try {
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        console.error(`Token account creation failed: ${JSON.stringify(confirmation.value.err)}`);
        throw new Error(`Failed to create token account: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log(`Successfully created token account(s), tx: ${signature}`);
      return signature;
    } catch (confirmError) {
      console.error(`Error confirming token account transaction: ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`);
      
      // Check if backup connection exists and try that
      if (backupConnection) {
        try {
          console.log(`Trying to confirm transaction with backup RPC: ${signature}`);
          const backupConfirmation = await backupConnection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');
          
          if (!backupConfirmation.value.err) {
            console.log(`Successfully confirmed token account(s) with backup RPC, tx: ${signature}`);
            return signature;
          }
        } catch (backupConfirmError) {
          console.error(`Backup RPC confirmation also failed: ${backupConfirmError instanceof Error ? backupConfirmError.message : String(backupConfirmError)}`);
        }
      }
      
      throw new Error(`Failed to confirm token account creation: ${confirmError instanceof Error ? confirmError.message : String(confirmError)}`);
    }
  } catch (error) {
    console.error(`Error submitting token account transaction: ${error instanceof Error ? error.message : String(error)}`);
    
    // Try backup RPC if available and this is a network error
    if (backupConnection) {
      try {
        console.log('Trying backup RPC endpoint...');
        const transactionBuffer = Buffer.from(serializedTransaction, 'base64');
        const signature = await backupConnection.sendRawTransaction(transactionBuffer, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 5
        });
        
        console.log(`Token account transaction sent via backup RPC: ${signature}`);
        
        // Confirm with backup connection
        const { blockhash, lastValidBlockHeight } = await backupConnection.getLatestBlockhash('confirmed');
        const confirmation = await backupConnection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight
          },
          'confirmed'
        );
        
        if (confirmation.value.err) {
          throw new Error(`Failed to create token account: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        return signature;
      } catch (backupError) {
        console.error(`Backup RPC send failed: ${backupError instanceof Error ? backupError.message : String(backupError)}`);
      }
    }
    
    throw new Error(`Failed to submit token account transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Gets the backup Solana RPC URL from environment variables
 * @returns The backup Solana RPC URL
 */
const getSolanaRpcBackupUrl = (): string => {
  return process.env.GLOBAL__BACKUP_RPC_URL || process.env.GLOBAL__MAINNET_RPC_URL || '';
}
