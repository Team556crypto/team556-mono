import { Request, Response } from 'express'
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, ParsedAccountData } from '@solana/web3.js'
import * as bip39 from 'bip39'
import { z } from 'zod'
import { Alchemy, Network, TokenPrice, GetTokenPriceByAddressResponse, TokenAddressRequest } from 'alchemy-sdk' 
import { Response as FetchResponse } from 'node-fetch'

// --- Zod Schemas --- 

// Input validation schema (reusable for both balance endpoints)
const addressSchema = z.object({
  address: z.string().refine(
    (addr) => {
      try {
        new PublicKey(addr)
        return true
      } catch (e) {
        return false
      }
    },
    { message: 'Invalid Solana address format' }
  )
})

// --- Helper Functions --- 

// Updated Helper to fetch prices for SOL and TEAM token using Alchemy SDK
interface PriceInfo {
  symbol: string
  price: number | null
}

// Initialize Alchemy SDK
const getAlchemyInstance = () => {
  const apiKey = process.env.GLOBAL__ALCHEMY_API_KEY
  if (!apiKey) {
    throw new Error('Alchemy API key (GLOBAL__ALCHEMY_API_KEY) is not configured')
  }
  const settings = {
    apiKey: apiKey,
    network: Network.SOLANA_MAINNET, // Using Solana Mainnet
  }
  return new Alchemy(settings)
}

async function fetchTokenPrices(): Promise<{ sol: PriceInfo; team: PriceInfo }> {
  const results: { sol: PriceInfo; team: PriceInfo } = {
    sol: { symbol: 'SOL', price: null },
    team: { symbol: 'TEAM', price: null },
  }
  const teamMintAddress = process.env.GLOBAL__TEAM_MINT

  if (!teamMintAddress) {
    console.error('TEAM token mint address (GLOBAL__TEAM_MINT) is not configured')
    // Return default prices if TEAM mint is missing, SOL might still work
  } else {
     results.team.symbol = teamMintAddress // Use mint address as identifier if needed later
  }

  try {
    const alchemy = getAlchemyInstance()
    console.log('Fetching SOL and TEAM prices using Alchemy SDK...')

    const promises = []

    // 1. Fetch SOL Price (still potentially easier via direct symbol endpoint if SDK lacks simple SOL price)
    // Keeping the direct fetch for SOL price as SDK might not have a simple 'get SOL price' function
    // Alternatively, one could get the price of WSOL (Wrapped SOL) token address.
    const solUrl = `https://api.g.alchemy.com/prices/v1/${alchemy.config.apiKey}/tokens/by-symbol?symbols=SOL`
    promises.push(
      fetch(solUrl, { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': 'Team-556-SolanaAPI/1.0' } })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(solData => {
          const solPriceData = solData?.data?.[0]?.prices?.[0]?.value
          if (solPriceData && !isNaN(parseFloat(solPriceData))) {
            results.sol.price = parseFloat(solPriceData)
            console.log(`Successfully fetched SOL price (direct): $${results.sol.price}`)
          } else {
            console.warn('Invalid SOL price data received from Alchemy (direct):', solData)
          }
        })
        .catch(async (error: unknown) => {
           const status = error instanceof FetchResponse ? error.status : 'N/A'; 
           const body = error instanceof FetchResponse ? await error.text().catch(() => 'Could not read SOL error body') : String(error);
           console.error(`Direct SOL Price API error! Status: ${status}, Body: ${body}`)
        })
    )

    // 2. Fetch TEAM Token Price using SDK
    if (teamMintAddress) {
      promises.push(
        // Use prices namespace and getTokenPriceByAddress
        alchemy.prices.getTokenPriceByAddress([{ address: teamMintAddress, network: Network.SOLANA_MAINNET }]) 
          .then((priceResponse: GetTokenPriceByAddressResponse) => { 
               // Price is nested inside the response data structure
               const priceData = priceResponse?.data?.[0]; // Get the first (only) result
               const priceValueString = priceData?.prices?.[0]?.value; // Value is a string
               if (priceData && typeof priceValueString === 'string') {
                   const parsedPrice = parseFloat(priceValueString);
                   if (!isNaN(parsedPrice)) { // Check if parsing was successful
                       results.team.price = parsedPrice; // Assign the parsed number
                       console.log(`Successfully fetched and parsed TEAM price (SDK) for ${teamMintAddress}: $${results.team.price}`);
                   } else {
                       console.warn(`Could not parse TEAM price string (SDK) for ${teamMintAddress}: '${priceValueString}'`);
                   }
               } else {
                   console.warn(`Could not determine TEAM price (SDK) for ${teamMintAddress}. Price data/value missing or invalid type. Raw price data:`, priceData?.prices);
               }
          })
          .catch((error: unknown) => {
              console.error(`Alchemy SDK TEAM Price error for ${teamMintAddress}:`, error instanceof Error ? error.message : String(error));
          })
      );
    }

    await Promise.allSettled(promises); // Wait for both fetches to complete or fail

    return results

  } catch (error) {
    console.error('Alchemy SDK price fetch failed:', error instanceof Error ? error.message : 'Unknown error')
    // Return default (all null prices) on major failure (e.g., SDK init fails)
    return results
  }
}


// --- Controller Functions --- 

export const createWallet = async (req: Request, res: Response) => {
  try {
    // Generate a new mnemonic phrase
    const mnemonic = bip39.generateMnemonic()

    // Create a seed buffer from the mnemonic
    // Use an empty passphrase for standard derivation
    const seed = bip39.mnemonicToSeedSync(mnemonic, '')

    // Generate a keypair from the first 32 bytes of the seed
    const keypair = Keypair.fromSeed(seed.slice(0, 32))

    res.status(201).json({
      publicKey: keypair.publicKey.toBase58(),
      mnemonic: mnemonic
    })
  } catch (error) {
    console.error('Error creating Solana wallet:', error)
    res
      .status(500)
      .json({ message: 'Failed to create wallet', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

export const getBalance = async (req: Request, res: Response) => {
  try {
    // Validate path parameters
    const validationResult = addressSchema.safeParse(req.params)
    if (!validationResult.success) {
      console.warn('Invalid address received for getBalance:', { errors: validationResult.error.errors, params: req.params })
      return res.status(400).json({ error: 'Invalid address format', details: validationResult.error.errors })
    }

    const { address } = validationResult.data
    const rpcUrl = process.env.GLOBAL__MAINNET_RPC_URL

    if (!rpcUrl) {
      console.error('GLOBAL__MAINNET_RPC_URL environment variable is not set.')
      return res.status(500).json({ error: 'Server configuration error: RPC URL missing' })
    }

    const connection = new Connection(rpcUrl, 'confirmed')
    const publicKey = new PublicKey(address)

    console.log(`Fetching balance for address: ${address} using RPC: ${rpcUrl}`)

    // Fetch balance and prices concurrently
    const [balanceLamports, prices] = await Promise.all([
      connection.getBalance(publicKey), // Fetch balance
      fetchTokenPrices()              // Fetch prices for SOL and TEAM
    ])

    const balanceSol = balanceLamports / LAMPORTS_PER_SOL
    const solPrice = prices.sol.price

    console.log(`Balance: ${balanceSol} SOL, Price: ${solPrice !== null ? '$' + solPrice : 'Fetch Failed'}`)

    // Decide on response if price fetch failed. Options:
    // 1. Return balance only with a warning/null price?
    // 2. Return an error?
    // Decision: Return balance but null price if price fetch fails, client can handle it.
    res.status(200).json({ 
      balance: balanceSol, 
      price: solPrice // Will be null if Alchemy fetch failed
    })

  } catch (error) {
    console.error('Error in getBalance handler:', error instanceof Error ? error.message : String(error))
    // Check for specific connection errors if needed
    res
      .status(500)
      .json({ error: 'Failed to process wallet balance request', details: error instanceof Error ? error.message : String(error) })
  }
}

// New controller for TEAM token balance
export const getTeamTokenBalance = async (req: Request, res: Response) => {
  try {
    // Validate path parameters
    const validationResult = addressSchema.safeParse(req.params)
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid address format', details: validationResult.error.errors })
    }

    const { address } = validationResult.data
    const rpcUrl = process.env.GLOBAL__MAINNET_RPC_URL
    const teamMintStr = process.env.GLOBAL__TEAM_MINT

    if (!rpcUrl) {
      console.error('GLOBAL__MAINNET_RPC_URL env var is not set.')
      return res.status(500).json({ error: 'Server config error: RPC URL missing' })
    }
    if (!teamMintStr) {
      console.error('GLOBAL__TEAM_MINT env var is not set.')
      return res.status(500).json({ error: 'Server config error: TEAM Mint missing' })
    }

    const connection = new Connection(rpcUrl, 'confirmed')
    const ownerPublicKey = new PublicKey(address)
    const teamMintPublicKey = new PublicKey(teamMintStr)

    console.log(`Fetching TEAM token balance for address: ${address}, Mint: ${teamMintStr}`)

    // Fetch account info and price concurrently
    const [tokenAccounts, prices] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(ownerPublicKey, { mint: teamMintPublicKey }),
      fetchTokenPrices()
    ]);

    const teamPrice = prices.team.price
    let teamBalance = 0

    // Check if accounts exist and if the first account has parsed info
    const firstAccountData = tokenAccounts.value?.[0]?.account?.data;
    if (firstAccountData && 'parsed' in firstAccountData && firstAccountData.parsed) {
      const accountInfo = firstAccountData.parsed.info;

      if (accountInfo && 'tokenAmount' in accountInfo && accountInfo.tokenAmount?.uiAmount) { // Check accountInfo and tokenAmount
        teamBalance = accountInfo.tokenAmount.uiAmount;
      }
      
      // Check if accountInfo exists before logging details
      if (accountInfo) { 
        console.log(`Found TEAM token account. Raw amount: ${accountInfo.tokenAmount?.amount}, Decimals: ${accountInfo.tokenAmount?.decimals}, UI Amount: ${teamBalance}`); 
      }
    } else {
      console.log(`No TEAM token account found for address ${address} and mint ${teamMintStr}`);
    }

    console.log(`TEAM Balance: ${teamBalance}, Price: ${teamPrice !== null ? '$' + teamPrice : 'Fetch Failed'}`);

    res.status(200).json({
      balance: teamBalance,
      price: teamPrice // Will be null if fetch failed
    });

  } catch (error) {
    console.error('Error in getTeamTokenBalance handler:', error instanceof Error ? error.message : String(error))
    res
      .status(500)
      .json({ error: 'Failed to process TEAM token balance request', details: error instanceof Error ? error.message : String(error) })
  }
}
