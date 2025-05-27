import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { encodeURL, TransactionRequestURLFields } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { z } from 'zod';
import crypto from 'crypto';

// Define the expected request body structure using Zod for validation
const PaymentRequestSchema = z.object({
    merchant_wallet: z.string().min(32).max(44), // Basic validation for Solana address length
    amount: z.number().positive(),
    reference: z.string().min(1),
    network: z.enum(['mainnet-beta', 'devnet']), // Only allow specific networks
    // Optional fields from Solana Pay spec:
    label: z.string().optional(),
    message: z.string().optional(),
    memo: z.string().optional(),
    // We might require a specific SPL token later, but start with SOL
    // splToken: z.string().optional(),
});

/**
 * Generates a unique PublicKey based on the string reference.
 * This is required by encodeURL for the reference field.
 */
function generateReferencePublicKey(referenceString: string): PublicKey {
    // Create a SHA-256 hash of the reference string
    const hash = crypto.createHash('sha256').update(referenceString).digest();
    // Ensure the hash is 32 bytes long (PublicKey requires 32 bytes)
    if (hash.length !== 32) {
        // This should technically not happen with SHA-256, but good to check
        throw new Error('Failed to generate a valid 32-byte hash for reference.');
    }
    return new PublicKey(hash);
}

export const createPaymentRequest = async (req: Request, res: Response) => {
    try {
        // Validate request body against the schema
        const validationResult = PaymentRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
            console.warn('Invalid payment request body:', validationResult.error.errors);
            return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() });
        }

        const {
            merchant_wallet,
            amount,
            reference,
            network, // Included for potential future use, though @solana/pay URL itself is network-agnostic
            label,
            message,
            memo
        } = validationResult.data;

        console.log(`Processing payment request for ${amount} to ${merchant_wallet} with ref: ${reference} on ${network}`);

        // Convert merchant wallet string to PublicKey
        let recipient: PublicKey;
        try {
            recipient = new PublicKey(merchant_wallet);
        } catch (error) {
            console.warn('Invalid merchant wallet address:', merchant_wallet, error);
            return res.status(400).json({ error: 'Invalid merchant wallet address provided.' });
        }

        // Convert amount to BigNumber (required by encodeURL)
        const amountBigNumber = new BigNumber(amount);

        // Generate a unique PublicKey reference (required by encodeURL)
        let referencePublicKey: PublicKey;
        try {
            referencePublicKey = generateReferencePublicKey(reference);
        } catch (error: any) { // Catch error from generateReferencePublicKey
            console.error('Error generating reference PublicKey:', error);
            return res.status(500).json({ error: 'Internal server error generating payment reference.' });
        }

        // Construct the Solana Pay URL parameters
        const urlParams = {
            recipient: recipient,
            amount: amountBigNumber,
            reference: referencePublicKey,
            label: label, // Optional: Store name or item name
            message: message, // Optional: Order ID or customer note
            memo: memo, // Optional: Typically the reference ID again for on-chain lookup
            // splToken: splToken ? new PublicKey(splToken) : undefined, // Add later if needed
        };

        // Generate the Solana Pay URL
        const url = encodeURL(urlParams);

        console.log(`Generated Solana Pay URL: ${url}`);

        // Return the generated URL
        return res.status(200).json({
            solana_pay_url: url.toString(),
            reference: reference // Echo back the original reference for client use
        });

    } catch (error) {
        console.error('Error creating Solana payment request:', error);
        // Generic error for unexpected issues
        return res.status(500).json({ error: 'Internal server error processing payment request.' });
    }
};
