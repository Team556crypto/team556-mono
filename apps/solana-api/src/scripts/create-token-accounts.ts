/**
 * Script to ensure Team556 token accounts exist for all users
 * 
 * Run this script with:
 * ts-node src/scripts/create-token-accounts.ts
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

// Hardcoded program IDs to avoid ESM import issues
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Function to get the associated token account address
async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

// Function to create ATA instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
) {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  });
}

async function main() {
  // Get the Team556 token mint address from environment variable
  const teamMintStr = process.env.GLOBAL__TEAM_MINT;
  if (!teamMintStr) {
    console.error('GLOBAL__TEAM_MINT environment variable is not set');
    process.exit(1);
  }

  // Get the admin wallet keypair
  // This should be a wallet with SOL to pay for account creations
  let adminKeypair: Keypair;
  try {
    // Load admin keypair from file or environment variable
    // Example: You could put the private key in a .env file or use a keypair file
    const adminPrivateKeyStr = process.env.ADMIN_PRIVATE_KEY;
    if (adminPrivateKeyStr) {
      // Load from environment variable
      const privateKey = Buffer.from(adminPrivateKeyStr, 'base64');
      adminKeypair = Keypair.fromSecretKey(privateKey);
    } else {
      // Or load from a keypair file
      const keypairFile = process.env.ADMIN_KEYPAIR_FILE || './admin-keypair.json';
      const keypairData = JSON.parse(fs.readFileSync(keypairFile, 'utf-8'));
      adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    }
    console.log(`Admin wallet: ${adminKeypair.publicKey.toString()}`);
  } catch (error) {
    console.error('Failed to load admin keypair:', error);
    console.error('Please set ADMIN_PRIVATE_KEY environment variable or ADMIN_KEYPAIR_FILE');
    process.exit(1);
  }

  // Connect to Solana network
  const rpcUrl = process.env.GLOBAL__MAINNET_RPC_URL;
  if (!rpcUrl) {
    console.error('GLOBAL__MAINNET_RPC_URL environment variable is not set');
    process.exit(1);
  }
  
  const connection = new Connection(rpcUrl, 'confirmed');
  
  // Check admin wallet balance
  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log(`Admin wallet balance: ${balance / 1000000000} SOL`);
  
  if (balance < 100000) { // Need at least 0.0001 SOL
    console.error('Admin wallet does not have enough SOL to pay for transactions');
    process.exit(1);
  }

  // Create Team556 token mint
  const teamMint = new PublicKey(teamMintStr);
  
  // Get list of wallet addresses from database or file
  // For now, we'll read from a wallets.txt file (one wallet per line)
  // or you can replace this with a database query
  let walletAddresses: string[] = [];
  try {
    if (fs.existsSync('./wallets.txt')) {
      walletAddresses = fs.readFileSync('./wallets.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } else {
      console.log('No wallets.txt file found. You can create this file with one wallet address per line.');
      
      // For testing, you can add some addresses here
      const testAddresses = process.env.TEST_WALLET_ADDRESSES;
      if (testAddresses) {
        walletAddresses = testAddresses.split(',');
      }
    }
  } catch (error) {
    console.error('Error reading wallet addresses:', error);
    process.exit(1);
  }

  if (walletAddresses.length === 0) {
    console.error('No wallet addresses found to process');
    process.exit(1);
  }

  console.log(`Processing ${walletAddresses.length} wallet addresses...`);

  // Process each wallet
  let created = 0;
  let alreadyExists = 0;
  let failed = 0;

  for (const [index, address] of walletAddresses.entries()) {
    try {
      // Parse wallet address
      const walletPubkey = new PublicKey(address);
      console.log(`[${index + 1}/${walletAddresses.length}] Processing wallet: ${walletPubkey.toString()}`);
      
      // Get associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(teamMint, walletPubkey);
      console.log(`  Token account address: ${tokenAccountAddress.toString()}`);
      
      // Check if token account already exists
      const tokenAccount = await connection.getAccountInfo(tokenAccountAddress);
      if (tokenAccount) {
        console.log(`  Token account already exists`);
        alreadyExists++;
        continue;
      }
      
      // Create token account
      console.log(`  Creating token account...`);
      
      // Create transaction
      const createAtaIx = createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey,
        tokenAccountAddress,
        walletPubkey,
        teamMint
      );
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      const transaction = new Transaction()
        .add(createAtaIx);
      
      transaction.feePayer = adminKeypair.publicKey;
      transaction.recentBlockhash = blockhash;
      
      // Sign and send transaction
      transaction.sign(adminKeypair);
      const signature = await connection.sendTransaction(transaction, [adminKeypair]);
      console.log(`  Transaction sent: ${signature}`);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      if (confirmation.value.err) {
        console.error(`  Error creating token account: ${JSON.stringify(confirmation.value.err)}`);
        failed++;
      } else {
        console.log(`  Token account created successfully`);
        created++;
      }
    } catch (error) {
      console.error(`  Error processing wallet ${address}:`, error);
      failed++;
    }
    
    // Add a small delay between transactions to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nSummary:`);
  console.log(`- Total wallets processed: ${walletAddresses.length}`);
  console.log(`- Token accounts created: ${created}`);
  console.log(`- Token accounts already existed: ${alreadyExists}`);
  console.log(`- Failed: ${failed}`);
}

main().catch(console.error); 