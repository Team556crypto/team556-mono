import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

/**
 * Middleware to authenticate internal API requests using a shared secret.
 * Expects the secret in the 'X-Internal-Api-Key' header.
 */
export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-internal-api-key'];

    if (!INTERNAL_API_SECRET) {
        console.error('FATAL: INTERNAL_API_SECRET is not set in environment variables for solana-api.');
        // Don't expose internal config issues directly
        return res.status(500).json({ error: 'Internal Server Configuration Error' }); 
    }

    if (!apiKey) {
         console.warn('Missing X-Internal-Api-Key header.');
         return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
    }

    if (apiKey !== INTERNAL_API_SECRET) {
        console.warn('Invalid X-Internal-Api-Key received.');
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }

    // If the key matches, proceed to the next handler
    next(); 
};
