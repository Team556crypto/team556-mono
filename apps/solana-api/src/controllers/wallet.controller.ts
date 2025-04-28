import { Request, Response } from 'express'
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, ParsedAccountData, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js'
import * as bip39 from 'bip39'
import { z } from 'zod'
import { Alchemy, Network, TokenPrice, GetTokenPriceByAddressResponse, TokenAddressRequest } from 'alchemy-sdk'
import { Response as FetchResponse } from 'node-fetch'
import { derivePath } from 'ed25519-hd-key'

// Hardcoded program IDs to avoid ESM import issues
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// --- Zod Schemas ---

// Input validation schema (reusable for both balance endpoints)
const addressSchema = z.object({
  address: z.string().refine(
    addr => {
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

// --- Zod Schema for Sign Transaction ---
const signTransactionSchema = z.object({
  mnemonic: z.string().refine(bip39.validateMnemonic, { message: 'Invalid mnemonic phrase' }),
  unsignedTransaction: z.string().min(1, { message: 'Unsigned transaction is required' }) // Expect base64 string
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
    network: Network.SOLANA_MAINNET // Using Solana Mainnet
  }
  return new Alchemy(settings)
}

async function fetchTokenPrices(): Promise<{ sol: PriceInfo; team: PriceInfo }> {
  const results: { sol: PriceInfo; team: PriceInfo } = {
    sol: { symbol: 'SOL', price: null },
    team: { symbol: 'TEAM', price: null }
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
    const promises = []

    // 1. Fetch SOL Price (still potentially easier via direct symbol endpoint if SDK lacks simple SOL price)
    // Keeping the direct fetch for SOL price as SDK might not have a simple 'get SOL price' function
    // Alternatively, one could get the price of WSOL (Wrapped SOL) token address.
    const solUrl = `https://api.g.alchemy.com/prices/v1/${alchemy.config.apiKey}/tokens/by-symbol?symbols=SOL`
    promises.push(
      fetch(solUrl, { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': 'Team-556-SolanaAPI/1.0' } })
        .then(res => (res.ok ? res.json() : Promise.reject(res)))
        .then(solData => {
          const solPriceData = solData?.data?.[0]?.prices?.[0]?.value
          if (solPriceData && !isNaN(parseFloat(solPriceData))) {
            results.sol.price = parseFloat(solPriceData)
          } else {
            console.warn('Invalid SOL price data received from Alchemy (direct):', solData)
          }
        })
        .catch(async (error: unknown) => {
          const status = error instanceof FetchResponse ? error.status : 'N/A'
          const body =
            error instanceof FetchResponse
              ? await error.text().catch(() => 'Could not read SOL error body')
              : String(error)
          console.error(`Direct SOL Price API error! Status: ${status}, Body: ${body}`)
        })
    )

    // 2. Fetch TEAM Token Price using SDK
    if (teamMintAddress) {
      promises.push(
        // Use prices namespace and getTokenPriceByAddress
        alchemy.prices
          .getTokenPriceByAddress([{ address: teamMintAddress, network: Network.SOLANA_MAINNET }])
          .then((priceResponse: GetTokenPriceByAddressResponse) => {
            // Price is nested inside the response data structure
            const priceData = priceResponse?.data?.[0] // Get the first (only) result
            const priceValueString = priceData?.prices?.[0]?.value // Value is a string
            if (priceData && typeof priceValueString === 'string') {
              const parsedPrice = parseFloat(priceValueString)
              if (!isNaN(parsedPrice)) {
                // Check if parsing was successful
                results.team.price = parsedPrice // Assign the parsed number
              } else {
                console.warn(`Could not parse TEAM price string (SDK) for ${teamMintAddress}: '${priceValueString}'`)
              }
            } else {
              console.warn(
                `Could not determine TEAM price (SDK) for ${teamMintAddress}. Price data/value missing or invalid type. Raw price data:`,
                priceData?.prices
              )
            }
          })
          .catch((error: unknown) => {
            console.error(
              `Alchemy SDK TEAM Price error for ${teamMintAddress}:`,
              error instanceof Error ? error.message : String(error)
            )
          })
      )
    }

    await Promise.allSettled(promises) // Wait for both fetches to complete or fail

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

    // Define the standard Solana derivation path (SLIP-0010)
    const derivationPath = `m/44'/501'/0'/0'`

    // Derive the key using the standard path
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key

    // Generate a keypair from the derived seed
    const keypair = Keypair.fromSeed(derivedSeed)
    
    console.log(`Creating new wallet with public key: ${keypair.publicKey.toBase58()}`)

    // No longer creating token accounts during wallet creation
    // Token accounts will be created on-demand during swaps

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

/**
 * Get the Team token account address for a wallet
 */
async function getTeamTokenAccountAddress(
  owner: PublicKey,
  teamMint: PublicKey
): Promise<PublicKey> {
  const [address] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      teamMint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
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
  
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // Rent sysvar accessed via SysvarRent address
    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data,
  });
}

export const getBalance = async (req: Request, res: Response) => {
  try {
    // Validate path parameters
    const validationResult = addressSchema.safeParse(req.params)
    if (!validationResult.success) {
      console.warn('Invalid address received for getBalance:', {
        errors: validationResult.error.errors,
        params: req.params
      })
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

    // Fetch balance and prices concurrently
    const [balanceLamports, prices] = await Promise.all([
      connection.getBalance(publicKey), // Fetch balance
      fetchTokenPrices() // Fetch prices for SOL and TEAM
    ])

    const balanceSol = balanceLamports / LAMPORTS_PER_SOL
    const solPrice = prices.sol.price

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
    res.status(500).json({
      error: 'Failed to process wallet balance request',
      details: error instanceof Error ? error.message : String(error)
    })
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

    // Fetch account info and price concurrently
    const [tokenAccounts, prices] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(ownerPublicKey, { mint: teamMintPublicKey }),
      fetchTokenPrices()
    ])

    const teamPrice = prices.team.price
    let teamBalance = 0

    // Check if accounts exist and if the first account has parsed info
    const firstAccountData = tokenAccounts.value?.[0]?.account?.data
    if (firstAccountData && 'parsed' in firstAccountData && firstAccountData.parsed) {
      const accountInfo = firstAccountData.parsed.info

      if (accountInfo && 'tokenAmount' in accountInfo && accountInfo.tokenAmount?.uiAmount) {
        // Check accountInfo and tokenAmount
        teamBalance = accountInfo.tokenAmount.uiAmount
      }
    } else {
      console.log(`No TEAM token account found for address ${address} and mint ${teamMintStr}`)
    }

    res.status(200).json({
      balance: teamBalance,
      price: teamPrice // Will be null if fetch failed
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process TEAM token balance request',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

export const signTransaction = async (req: Request, res: Response) => {
  try {
    // 1. Validate Request Body
    const validationResult = signTransactionSchema.safeParse(req.body)
    if (!validationResult.success) {
      console.warn('Invalid signTransaction request body:', { errors: validationResult.error.errors, body: req.body })
      return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() })
    }

    const { mnemonic, unsignedTransaction } = validationResult.data

    // 2. Derive Keypair from Mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic, '') // Use empty passphrase
    const derivationPath = "m/44'/501'/0'/0'"
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key
    const keypair = Keypair.fromSeed(derivedSeed)
    const derivedPublicKey = keypair.publicKey.toBase58()
    console.log(`Derived PublicKey from Mnemonic (path ${derivationPath}): ${derivedPublicKey}`)

    // 3. Deserialize Unsigned Transaction
    const transactionBuffer = Buffer.from(unsignedTransaction, 'base64')
    const oldTransaction = Transaction.from(transactionBuffer)

    // Log expected fee payer
    const expectedFeePayer = oldTransaction.feePayer?.toBase58()
    console.log(`Transaction Fee Payer (expected signer): ${expectedFeePayer}`)
    
    // 4. Check if we need to modify the transaction
    if (expectedFeePayer && expectedFeePayer !== derivedPublicKey) {
      console.log(`Fee payer mismatch detected. Original: ${expectedFeePayer}, New: ${derivedPublicKey}`)
      
      // 5. Create a new transaction
      const newTransaction = new Transaction()
      
      // 6. Set blockhash
      newTransaction.recentBlockhash = oldTransaction.recentBlockhash || (await getLatestBlockhash())
      
      // 7. Set fee payer explicitly to our keypair
      newTransaction.feePayer = keypair.publicKey
      
      // 8. Process each instruction - important!
      if (oldTransaction.instructions && oldTransaction.instructions.length > 0) {
        console.log(`Examining ${oldTransaction.instructions.length} instructions...`)
        
        for (const oldInstruction of oldTransaction.instructions) {
          // Create a new instruction with modified account metas
          const newKeys = oldInstruction.keys.map(accountMeta => {
            // If this account meta references the old signer, update it to our signer
            if (accountMeta.pubkey.toBase58() === expectedFeePayer && accountMeta.isSigner) {
              console.log(`Replacing signer ${accountMeta.pubkey.toBase58()} with ${keypair.publicKey.toBase58()} in instruction`)
              return {
                pubkey: keypair.publicKey,
                isSigner: true,
                isWritable: accountMeta.isWritable
              }
            }
            // Otherwise keep it as is
            return accountMeta
          })
          
          // Create new instruction with updated account metas
          const newInstruction = new TransactionInstruction({
            keys: newKeys,
            programId: oldInstruction.programId,
            data: oldInstruction.data
          })
          
          // Add to our new transaction
          newTransaction.add(newInstruction)
        }
        console.log(`Modified and added ${oldTransaction.instructions.length} instructions to new transaction`)
      } else {
        console.warn('No instructions found in the original transaction')
        return res.status(400).json({ error: 'Invalid transaction: No instructions found' })
      }
      
      // 9. Sign the transaction with our keypair
      newTransaction.sign(keypair)
      console.log(`Transaction signed with keypair ${keypair.publicKey.toBase58()}`)
      
      // 10. Serialize and return
      try {
        const signedTxBuffer = newTransaction.serialize()
        const signedTxBase64 = signedTxBuffer.toString('base64')
        console.log(`Transaction successfully serialized`)
        return res.status(200).json({ signedTransaction: signedTxBase64 })
      } catch (serializeError) {
        console.error('Error serializing modified transaction:', serializeError)
        throw serializeError
      }
    } else {
      // No mismatch, we can just sign the original transaction
      console.log(`No fee payer mismatch detected, signing original transaction`)
      oldTransaction.sign(keypair)
      
      try {
        const signedTxBuffer = oldTransaction.serialize()
        const signedTxBase64 = signedTxBuffer.toString('base64')
        console.log(`Transaction successfully serialized`)
        return res.status(200).json({ signedTransaction: signedTxBase64 })
      } catch (serializeError) {
        console.error('Error serializing transaction:', serializeError)
        throw serializeError
      }
    }
  } catch (error: unknown) {
    console.error('Error signing transaction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during signing'
    return res.status(500).json({ message: 'Failed to sign transaction', error: errorMessage })
  }
}

// Helper function to get latest blockhash if needed
async function getLatestBlockhash(): Promise<string> {
  const rpcUrl = process.env.GLOBAL__MAINNET_RPC_URL
  if (!rpcUrl) {
    throw new Error('RPC URL not configured')
  }
  const connection = new Connection(rpcUrl)
  const { blockhash } = await connection.getLatestBlockhash()
  return blockhash
}
