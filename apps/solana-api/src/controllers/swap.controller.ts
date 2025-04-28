import { Request, Response } from 'express';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as swapService from '../services/swap.service';
import { QuoteGetRequest, QuoteResponse } from '@jup-ag/api'; 

// Define expected request body types for clarity
interface GetQuoteRequestBody {
    inputMint: string;
    outputMint: string;
    amount: number; // Amount in smallest unit (e.g., lamports for SOL)
    slippageBps?: number; // Optional: Basis points, e.g., 50 for 0.5%
    // Add other relevant QuoteGetRequest fields if needed by frontend
}

interface PostSwapRequestBody {
    quoteResponse: QuoteResponse; 
    userPrivateKey: string; // Expect base64 encoded private key string
}

interface CreateTokenAccountsRequestBody {
    signedTransaction: string; // Base64 encoded signed transaction
    userPrivateKey: string; // Expect base64 encoded private key string
}

/**
 * Handles requests for swap quotes.
 * Expects inputMint, outputMint, amount in request body.
 */
export const handleGetQuote = async (req: Request, res: Response) => {
    console.log("Received /quote request:", req.body);
    const { inputMint, outputMint, amount, slippageBps } = req.body as GetQuoteRequestBody;

    // Basic validation
    if (!inputMint || !outputMint || !amount) {
        return res.status(400).json({ message: 'Missing required fields: inputMint, outputMint, amount' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
         return res.status(400).json({ message: 'Invalid amount provided' });
    }
     if (slippageBps && (typeof slippageBps !== 'number' || slippageBps < 0)) {
        return res.status(400).json({ message: 'Invalid slippageBps provided' });
    }


    const quoteRequest: QuoteGetRequest = {
        inputMint,
        outputMint,
        amount,
        slippageBps,
        // platformFeeBps: 10, // Example: Add a 0.1% platform fee
    };

    try {
        const quote = await swapService.getQuote(quoteRequest);
        console.log("Sending quote response:", quote);
        res.status(200).json(quote);
    } catch (error: any) {
        console.error("Error in handleGetQuote:", error);
        res.status(500).json({ message: error.message || 'Failed to get quote' });
    }
};

/**
 * Handles requests to generate a swap transaction.
 * Expects quoteResponse and userPrivateKey in request body.
 */
export const handlePostSwap = async (req: Request<{}, {}, PostSwapRequestBody>, res: Response) => {
    console.log("Received /swap request:", req.body);
    const { quoteResponse, userPrivateKey } = req.body;

    if (!quoteResponse || !userPrivateKey) {
        return res.status(400).json({ error: 'Missing required fields: quoteResponse, userPrivateKey' });
    }

    try {
        // Execute swap transaction - will now check for required token accounts
        const result = await swapService.executeSwapTransaction(quoteResponse, userPrivateKey);
        
        // Check if token accounts need to be created
        if (typeof result === 'object' && 'requiresTokenAccounts' in result) {
            console.log('Token accounts need to be created first:', result.missingAccounts);
            // Return information for creating token accounts
            return res.status(202).json({
                status: 'needs_token_accounts',
                createAccountTransaction: result.createAccountTransaction,
                missingAccounts: result.missingAccounts,
                message: 'Token accounts need to be created. The client should sign this transaction and submit it via /create-token-accounts endpoint.'
            });
        }
        
        // If we got here, it's a successful transaction signature
        res.status(200).json({ 
            status: 'success',
            signature: result // This is the transaction signature string
        });
    } catch (error: any) {
        console.error('Error executing swap transaction:', error);
        
        // Enhanced error logging for specific error types
        if (error.message && error.message.includes('Signature verification failed')) {
            console.error('Signature verification error detected. This likely means the transaction needs to be signed by the client.');
            return res.status(400).json({
                status: 'error',
                error: 'Signature verification failed',
                details: 'The transaction requires client-side signing',
                errorType: 'SignatureError'
            });
        }
        
        // Handle Jupiter API errors
        if (error.message && error.message.includes('Jupiter')) {
            console.error('Jupiter API error detected:', error.message);
        }
        
        // Handle transaction simulation errors
        if (error.message && error.message.includes('Transaction simulation failed')) {
            console.error('Solana simulation error details:', error.message);
        }
        
        // Provide more detailed error response
        res.status(500).json({ 
            status: 'error',
            error: 'Failed to execute swap transaction', 
            details: error.message || error,
            errorType: error.name || 'Unknown'
        });
    }
};

/**
 * Handles creation of token accounts before a swap.
 * Expects signedTransaction (from the frontend after user approval) in request body.
 */
export const handleCreateTokenAccounts = async (req: Request<{}, {}, CreateTokenAccountsRequestBody>, res: Response) => {
    console.log("Received /create-token-accounts request");
    const { signedTransaction, userPrivateKey } = req.body;

    if (!signedTransaction) {
        return res.status(400).json({ 
            status: 'error',
            error: 'Missing required field: signedTransaction. This transaction must be signed by the client before submission.' 
        });
    }

    try {
        // Submit the token account creation transaction that was signed by the client
        const signature = await swapService.submitTokenAccountTransaction(signedTransaction);
        
        // Return success with the transaction signature
        res.status(200).json({
            status: 'success',
            signature,
            message: 'Token accounts created successfully'
        });
    } catch (error: any) {
        console.error('Error creating token accounts:', error);
        
        res.status(500).json({
            status: 'error',
            error: 'Failed to create token accounts',
            details: error.message || error,
            errorType: error.name || 'Unknown'
        });
    }
};
