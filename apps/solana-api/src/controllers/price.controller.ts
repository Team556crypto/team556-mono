import { Request, Response } from 'express';
import { QuoteGetRequest } from '@jup-ag/api';
import * as swapService from '../services/swap.service';
import BigNumber from 'bignumber.js';

const TEAM556_MINT = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TEAM556_DECIMALS = 6;
const USDC_DECIMALS = 6;

/**
 * Fetches the current price of 1 TEAM556 token in USDC.
 */
export const getTeam556UsdcPrice = async (req: Request, res: Response) => {
  try {
    const amountForOneToken = new BigNumber(1).shiftedBy(TEAM556_DECIMALS).toNumber();

    const quoteRequest: QuoteGetRequest = {
      inputMint: TEAM556_MINT,
      outputMint: USDC_MINT,
      amount: amountForOneToken, // Amount of TEAM556 in its smallest unit
      // slippageBps: 50, // Optional: 0.5% slippage, can be omitted for pure price check
      onlyDirectRoutes: true, // Consider direct routes for a cleaner price if possible
    };

    const quote = await swapService.getQuote(quoteRequest);

    if (!quote || !quote.outAmount) {
      return res.status(500).json({ message: 'Failed to retrieve a valid price quote.' });
    }

    // outAmount is in the smallest unit of USDC
    const priceInUsdc = new BigNumber(quote.outAmount.toString()).shiftedBy(-USDC_DECIMALS).toNumber();

    res.status(200).json({
      inputMint: TEAM556_MINT,
      outputMint: USDC_MINT,
      price: priceInUsdc,
      source: 'jupiter',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching TEAM556/USDC price:', error);
    res.status(500).json({ message: error.message || 'Failed to get TEAM556/USDC price' });
  }
};
