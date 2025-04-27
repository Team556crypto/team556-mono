import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
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
        // We now need a service function that takes the private key and handles signing/sending
        const signature = await swapService.executeSwapTransaction(quoteResponse, userPrivateKey);
        res.status(200).json({ signature }); // Return the transaction signature
    } catch (error: any) {
        console.error('Error executing swap transaction:', error);
        // Provide more specific errors if possible based on service logic
        res.status(500).json({ error: 'Failed to execute swap transaction', details: error.message || error });
    }
};
