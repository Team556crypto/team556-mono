/**
 * Script to ensure Team556 token accounts exist for all users
 *
 * Run this script with:
 * ts-node src/scripts/create-token-accounts.ts
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') })

// Hardcoded program IDs to avoid ESM import issues
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

// Function to get the associated token account address
async function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return address
}

// Function to create ATA instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey
) {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }
  ]

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0)
  })
}

async function main() {
  // Get the Team556 token mint address from environment variable
  const teamMintStr = process.env.GLOBAL__TEAM_MINT
  if (!teamMintStr) {
    console.error('GLOBAL__TEAM_MINT environment variable is not set')
    process.exit(1)
  }

  // Get the admin wallet keypair
  // This should be a wallet with SOL to pay for account creations
  let adminKeypair: Keypair
  try {
    // Load admin keypair from file or environment variable
    // Example: You could put the private key in a .env file or use a keypair file
    const adminPrivateKeyStr = process.env.ADMIN_PRIVATE_KEY
    if (adminPrivateKeyStr) {
      // Load from environment variable
      const privateKey = Buffer.from(adminPrivateKeyStr, 'base64')
      adminKeypair = Keypair.fromSecretKey(privateKey)
    } else {
      // Or load from a keypair file
      const keypairFile = process.env.ADMIN_KEYPAIR_FILE || './admin-keypair.json'
      const keypairData = JSON.parse(fs.readFileSync(keypairFile, 'utf-8'))
      adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData))
    }
  } catch (error) {
    process.exit(1)
  }

  // Connect to Solana network
  const rpcUrl = process.env.GLOBAL__MAINNET_RPC_URL
  if (!rpcUrl) {
    console.error('GLOBAL__MAINNET_RPC_URL environment variable is not set')
    process.exit(1)
  }

  const connection = new Connection(rpcUrl, 'confirmed')

  // Check admin wallet balance
  const balance = await connection.getBalance(adminKeypair.publicKey)

  if (balance < 100000) {
    // Need at least 0.0001 SOL
    process.exit(1)
  }

  // Create Team556 token mint
  const teamMint = new PublicKey(teamMintStr)

  // Get list of wallet addresses from database or file
  // For now, we'll read from a wallets.txt file (one wallet per line)
  // or you can replace this with a database query
  let walletAddresses: string[] = []
  try {
    if (fs.existsSync('./wallets.txt')) {
      walletAddresses = fs
        .readFileSync('./wallets.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
    } else {
      // For testing, you can add some addresses here
      const testAddresses = process.env.TEST_WALLET_ADDRESSES
      if (testAddresses) {
        walletAddresses = testAddresses.split(',')
      }
    }
  } catch (error) {
    process.exit(1)
  }

  if (walletAddresses.length === 0) {
    process.exit(1)
  }

  // Process each wallet
  let created = 0
  let alreadyExists = 0
  let failed = 0

  for (const [index, address] of walletAddresses.entries()) {
    try {
      // Parse wallet address
      const walletPubkey = new PublicKey(address)

      // Get associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(teamMint, walletPubkey)

      // Check if token account already exists
      const tokenAccount = await connection.getAccountInfo(tokenAccountAddress)
      if (tokenAccount) {
        alreadyExists++
        continue
      }

      // Create transaction
      const createAtaIx = createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey,
        tokenAccountAddress,
        walletPubkey,
        teamMint
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
      const transaction = new Transaction().add(createAtaIx)

      transaction.feePayer = adminKeypair.publicKey
      transaction.recentBlockhash = blockhash

      // Sign and send transaction
      transaction.sign(adminKeypair)
      const signature = await connection.sendTransaction(transaction, [adminKeypair])

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      })

      if (confirmation.value.err) {
        console.error(`  Error creating token account: ${JSON.stringify(confirmation.value.err)}`)
        failed++
      } else {
        created++
      }
    } catch (error) {
      console.error(`  Error processing wallet ${address}:`, error)
      failed++
    }

    // Add a small delay between transactions to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\nSummary:`)
  console.log(`- Total wallets processed: ${walletAddresses.length}`)
  console.log(`- Token accounts created: ${created}`)
  console.log(`- Token accounts already existed: ${alreadyExists}`)
  console.log(`- Failed: ${failed}`)
}

main().catch(console.error)
