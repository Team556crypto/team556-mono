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
 * Executes the swap transaction.
 * @param {QuoteResponse} quoteResponse - The quote details.
 * @param {string} userPrivateKeyBase64 - The base64 encoded private key of the user.
 * @returns {Promise<string>} The transaction signature.
 */
export const executeSwapTransaction = async (
  quoteResponse: QuoteResponse,
  userPrivateKeyBase64: string
): Promise<string> => { // Fix: Correct return type to string (signature)
  const connection = new Connection(process.env.GLOBAL__MAINNET_RPC_URL || '', 'confirmed');
  let privateKeyBytes: Uint8Array;
  let userKeypair: Keypair;

  try {
    console.log("Executing swap transaction using instructions...");
    privateKeyBytes = base64.toByteArray(userPrivateKeyBase64);
    userKeypair = Keypair.fromSecretKey(privateKeyBytes);
    const userPublicKey = userKeypair.publicKey;
    privateKeyBytes.fill(0); // Clear sensitive data after use

    // 1. Get swap instructions from Jupiter
    const instructionsResponse = await getSwapInstructionsFromJupiter(userKeypair.publicKey, quoteResponse);
    if (!instructionsResponse) {
      throw new Error("Failed to get swap instructions from Jupiter.");
    }

    // Destructure the instructions response
    const { 
      computeBudgetInstructions, // Recommended compute budget instructions
      setupInstructions,         // Setup instructions, e.g. OpenATA
      swapInstruction,           // The actual swap instruction
      cleanupInstruction,        // Cleanup instructions, e.g. CloseATA
      addressLookupTableAddresses // ALT addresses
    } = instructionsResponse;

    // 2. Fetch Address Lookup Table Accounts (ALTs)
    console.log("Fetching ALTs...");
    const addressLookupTableAccounts = await getAdressLookupTableAccounts(
      connection, 
      addressLookupTableAddresses
    );
    console.log(`Fetched ${addressLookupTableAccounts.length} ALTs.`);

    // 3. Create Transaction Instructions Array
    // Add our priority fee instruction
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000_000, // 1 lamport per CU (adjust if still too low)
    });

    const instructions: TransactionInstruction[] = [
      priorityFeeInstruction, // Add our instruction first
      ...computeBudgetInstructions.map(instructionDataToTransactionInstruction),
      ...setupInstructions.map(instructionDataToTransactionInstruction),
      instructionDataToTransactionInstruction(swapInstruction),
      instructionDataToTransactionInstruction(cleanupInstruction),
    ].filter((ix): ix is TransactionInstruction => ix !== null);

    if (instructions.length === 0) {
        throw new Error("No instructions found for swap.");
    }

    // 4. Get Latest Blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log(`Using blockhash: ${blockhash}`);

    // 5. Compile Transaction Message
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    // 6. Create and Sign Versioned Transaction
    const transaction = new VersionedTransaction(messageV0);
    console.log("Signing transaction...");
    transaction.sign([userKeypair]);

    // --- Simulation (Preflight) ---
    try {
      const sim = await connection.simulateTransaction(transaction, {
        commitment: 'processed',
        replaceRecentBlockhash: true,
      });
      if (sim.value.err) {
        console.error('Simulation error:', sim.value.err);
        console.error('Simulation logs:', sim.value.logs);
        throw new Error(`Transaction simulation failed: ${JSON.stringify(sim.value.err)}`);
      }
      console.log('Simulation successful.');
    } catch (simErr) {
      console.error('Simulation exception:', simErr);
      throw simErr;
    }

    // 7. Send Transaction
    console.log("Sending transaction...");
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false, // Let RPC perform preflight
      maxRetries: 10,
    });
    console.log(`Transaction sent. Signature: ${txid}`);

    // 8. Confirm Transaction
    console.log(`Confirming transaction: ${txid}`);
    const confirmation = await connection.confirmTransaction(
      {
        signature: txid,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      },
      'confirmed' // Can use 'processed', 'confirmed', or 'finalized'
    );

    if (confirmation.value.err) {
      console.error('Transaction confirmation failed:', confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log('Transaction confirmed successfully.');
    return txid; // Return the signature string

  } catch (error) {
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
