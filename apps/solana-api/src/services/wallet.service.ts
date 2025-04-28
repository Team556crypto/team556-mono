import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import base64 from 'base64-js';

// Hardcoded program IDs to avoid ESM import issues
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/**
 * Complete Solana wallet service with functionality for:
 * - Wallet creation
 * - Token account management
 * - Sending/receiving tokens
 * - Transaction management
 */
export class SolanaWalletService {
  private connection: Connection;
  private teamMint: PublicKey | null = null;

  constructor(rpcUrl: string, teamMintAddress?: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    if (teamMintAddress) {
      this.teamMint = new PublicKey(teamMintAddress);
    }
  }

  /**
   * Creates a new wallet
   * @returns Created wallet info
   */
  async createWallet() {
    // Generate a new mnemonic phrase
    const mnemonic = bip39.generateMnemonic();
    
    // Create a seed buffer from the mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    
    // Define the standard Solana derivation path
    const derivationPath = `m/44'/501'/0'/0'`;
    
    // Derive the key using the standard path
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    
    // Generate a keypair from the derived seed
    const keypair = Keypair.fromSeed(derivedSeed);
    
    console.log(`Created new wallet with public key: ${keypair.publicKey.toBase58()}`);
    
    // Create token accounts if team mint is configured
    if (this.teamMint) {
      // Add retry logic for token account creation
      let attemptCount = 0;
      const maxAttempts = 3;
      let tokenAccountCreated = false;
      let lastError = null;

      while (attemptCount < maxAttempts && !tokenAccountCreated) {
        try {
          console.log(`Attempt ${attemptCount + 1}/${maxAttempts} to create token account for TEAM mint: ${this.teamMint.toString()}`);
          const result = await this.createTokenAccount(keypair, this.teamMint);
          
          if (result && result.created) {
            console.log(`Successfully created TEAM token account: ${result.address}`);
            tokenAccountCreated = true;
          } else {
            console.log(`Token account already exists or creation returned: ${JSON.stringify(result)}`);
            tokenAccountCreated = true; // Consider it success if the account already exists
          }
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attemptCount + 1}/${maxAttempts} failed to create token account:`, error);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        attemptCount++;
      }

      if (!tokenAccountCreated) {
        console.error(`Failed to create TEAM token account after ${maxAttempts} attempts. Last error:`, lastError);
        // We don't throw here as we still want to return the wallet even if token account creation failed
      }
    }
    
    return {
      publicKey: keypair.publicKey.toBase58(),
      mnemonic: mnemonic
    };
  }

  /**
   * Creates a token account for a user's wallet
   * @param ownerOrKeypair Owner's keypair or public key
   * @param mint Token mint public key
   * @param payerKeypair Keypair that will pay for the transaction (if different from owner)
   * @returns Information about the token account creation
   */
  async createTokenAccount(
    ownerOrKeypair: Keypair | PublicKey, 
    mint: PublicKey,
    payerKeypair?: Keypair
  ) {
    let ownerPublicKey: PublicKey;
    let payer: Keypair;
    
    // Determine owner public key and payer from parameters
    if (ownerOrKeypair instanceof Keypair) {
      ownerPublicKey = ownerOrKeypair.publicKey;
      payer = payerKeypair || ownerOrKeypair;
    } else {
      ownerPublicKey = ownerOrKeypair;
      if (!payerKeypair) {
        throw new Error('When owner is a PublicKey, payerKeypair must be provided');
      }
      payer = payerKeypair;
    }
    
    // Calculate the associated token account address
    const tokenAccountAddress = await this.getAssociatedTokenAddress(mint, ownerPublicKey);
    console.log(`Associated token address: ${tokenAccountAddress.toString()} for mint ${mint.toString()}`);
    
    // Check if the account already exists
    try {
      const accountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
      if (accountInfo) {
        console.log(`Token account ${tokenAccountAddress.toString()} already exists`);
        return {
          address: tokenAccountAddress.toString(),
          created: false
        };
      }
    } catch (error) {
      console.log('Error checking token account, will attempt to create:', error);
    }
    
    // Create the token account since it doesn't exist
    console.log(`Creating token account ${tokenAccountAddress.toString()} for mint ${mint.toString()}`);
    
    try {
      // Build the create instruction
      const createAtaIx = this.createAssociatedTokenAccountInstruction(
        payer.publicKey,
        tokenAccountAddress,
        ownerPublicKey,
        mint
      );
      
      // Get recent blockhash with retry
      let blockhash, lastValidBlockHeight;
      try {
        const blockHashResult = await this.connection.getLatestBlockhash('finalized');
        blockhash = blockHashResult.blockhash;
        lastValidBlockHeight = blockHashResult.lastValidBlockHeight;
        console.log(`Got blockhash: ${blockhash}, lastValidBlockHeight: ${lastValidBlockHeight}`);
      } catch (bhError) {
        console.error('Error getting blockhash, retrying:', bhError);
        // Try one more time with a slight delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const blockHashResult = await this.connection.getLatestBlockhash('finalized');
        blockhash = blockHashResult.blockhash;
        lastValidBlockHeight = blockHashResult.lastValidBlockHeight;
      }
      
      // Create and sign the transaction
      const transaction = new Transaction();
      transaction.feePayer = payer.publicKey;
      transaction.recentBlockhash = blockhash;
      transaction.add(createAtaIx);
      
      transaction.sign(payer);
      
      // Send the transaction with higher retry count
      const signature = await this.connection.sendTransaction(transaction, [payer], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 5 // Increase retries
      });
      
      console.log(`Sent token account creation transaction: ${signature}`);
      
      // Wait for confirmation with timeout and polling
      console.log(`Confirming transaction ${signature}...`);
      const startTime = Date.now();
      const timeout = 15000; // 15 second timeout
      const interval = 1000; // Check every second
      
      while (Date.now() - startTime < timeout) {
        try {
          const status = await this.connection.getSignatureStatus(signature, {searchTransactionHistory: true});
          console.log(`Transaction status: ${JSON.stringify(status?.value?.confirmationStatus || 'pending')}`);
          
          if (status?.value) {
            if (status.value.err) {
              console.error(`Token account creation failed: ${JSON.stringify(status.value.err)}`);
              throw new Error(`Failed to create token account: ${JSON.stringify(status.value.err)}`);
            }
            
            if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
              console.log(`Successfully created token account ${tokenAccountAddress.toString()} for mint ${mint.toString()}`);
              // Verify the account was created
              const accountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
              if (!accountInfo) {
                console.warn(`Account ${tokenAccountAddress.toString()} not found despite successful transaction`);
              }
              
              return {
                address: tokenAccountAddress.toString(),
                created: true,
                signature
              };
            }
          }
          
          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error: any) {
          console.warn('Error checking transaction status:', error);
          // Continue polling despite errors
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
      
      // Final check after timeout
      try {
        const status = await this.connection.getSignatureStatus(signature, {searchTransactionHistory: true});
        if (status?.value && !status.value.err && 
          (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized')) {
          console.log(`Transaction confirmed on final check with status: ${status.value.confirmationStatus}`);
          return {
            address: tokenAccountAddress.toString(),
            created: true,
            signature
          };
        }
        
        throw new Error(`Transaction confirmation timed out after ${timeout/1000} seconds. Final status: ${JSON.stringify(status?.value?.confirmationStatus || 'unknown')}`);
      } catch (error: any) {
        console.error(`Final transaction status check failed:`, error);
        throw new Error(`Failed to confirm token account creation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating token account:', error);
      // Try to check if the account was created anyway (sometimes transactions succeed but confirmations fail)
      try {
        const accountInfo = await this.connection.getAccountInfo(tokenAccountAddress);
        if (accountInfo) {
          console.log(`Token account ${tokenAccountAddress.toString()} exists despite transaction error`);
          return {
            address: tokenAccountAddress.toString(),
            created: true,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      } catch (checkError) {
        // Ignore check errors and throw the original error
      }
      throw error;
    }
  }

  /**
   * Sends SOL from one wallet to another
   * @param senderKeypair Sender's keypair
   * @param recipientAddress Recipient's address
   * @param amount Amount to send (in SOL)
   * @returns Transaction signature
   */
  async sendSol(senderKeypair: Keypair, recipientAddress: string, amount: number) {
    try {
      const recipient = new PublicKey(recipientAddress);
      const lamports = amount * LAMPORTS_PER_SOL;
      
      console.log(`Sending ${amount} SOL (${lamports} lamports) from ${senderKeypair.publicKey.toString()} to ${recipient.toString()}`);
      
      // Create a simple SOL transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipient,
        lamports
      });
      
      // Get a recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      
      // Create transaction
      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = senderKeypair.publicKey;
      transaction.recentBlockhash = blockhash;
      
      // Sign and send
      const signature = await sendAndConfirmTransaction(this.connection, transaction, [senderKeypair], {
        commitment: 'confirmed',
        skipPreflight: false
      });
      
      console.log(`SOL transfer successful with signature: ${signature}`);
      
      return {
        signature,
        amount,
        sender: senderKeypair.publicKey.toString(),
        recipient: recipient.toString()
      };
    } catch (error) {
      console.error('Error sending SOL:', error);
      throw error;
    }
  }

  /**
   * Sends tokens from one wallet to another
   * @param senderKeypair Sender's keypair
   * @param recipientAddress Recipient's address
   * @param mint Token mint address
   * @param amount Amount to send (in token units)
   * @returns Transaction signature
   */
  async sendToken(senderKeypair: Keypair, recipientAddress: string, mint: string, amount: number) {
    try {
      const recipient = new PublicKey(recipientAddress);
      const mintPubkey = new PublicKey(mint);
      
      // Get token accounts for sender and recipient
      const senderTokenAccount = await this.getAssociatedTokenAddress(mintPubkey, senderKeypair.publicKey);
      const recipientTokenAccount = await this.getAssociatedTokenAddress(mintPubkey, recipient);
      
      console.log(`Sending ${amount} tokens from ${senderKeypair.publicKey.toString()} to ${recipient.toString()}`);
      console.log(`Source token account: ${senderTokenAccount.toString()}`);
      console.log(`Destination token account: ${recipientTokenAccount.toString()}`);
      
      // Check if recipient token account exists, create if not
      const recipientAccountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
      
      const instructions: TransactionInstruction[] = [];
      
      // If recipient token account doesn't exist, create it
      if (!recipientAccountInfo) {
        console.log(`Recipient token account doesn't exist, creating it...`);
        instructions.push(
          this.createAssociatedTokenAccountInstruction(
            senderKeypair.publicKey,
            recipientTokenAccount,
            recipient,
            mintPubkey
          )
        );
      }
      
      // Add transfer instruction
      instructions.push(
        this.createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          senderKeypair.publicKey,
          amount
        )
      );
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      
      // Create transaction
      const transaction = new Transaction();
      transaction.feePayer = senderKeypair.publicKey;
      transaction.recentBlockhash = blockhash;
      transaction.add(...instructions);
      
      // Sign and send
      const signature = await sendAndConfirmTransaction(this.connection, transaction, [senderKeypair], {
        commitment: 'confirmed',
        skipPreflight: false
      });
      
      console.log(`Token transfer successful with signature: ${signature}`);
      
      return {
        signature,
        amount,
        sender: senderKeypair.publicKey.toString(),
        recipient: recipient.toString(),
        mint
      };
    } catch (error) {
      console.error('Error sending token:', error);
      throw error;
    }
  }
  
  /**
   * Gets a wallet's SOL balance
   * @param address Wallet address
   * @returns Balance in SOL
   */
  async getSolBalance(address: string) {
    const publicKey = new PublicKey(address);
    const balanceInLamports = await this.connection.getBalance(publicKey);
    const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
    
    return {
      address,
      balanceInLamports,
      balanceInSol
    };
  }
  
  /**
   * Gets a wallet's token balance
   * @param walletAddress Wallet address
   * @param mintAddress Token mint address
   * @returns Token balance info
   */
  async getTokenBalance(walletAddress: string, mintAddress: string) {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);
    
    // Get the token account address
    const tokenAccountAddress = await this.getAssociatedTokenAddress(mint, wallet);
    
    try {
      // Try to get token account info
      const accountInfo = await this.connection.getParsedAccountInfo(tokenAccountAddress);
      
      // If account exists and has data
      if (accountInfo.value) {
        // Extract the balance if it's a token account
        if ('parsed' in accountInfo.value.data) {
          const parsedData = accountInfo.value.data.parsed;
          
          if (parsedData.info?.tokenAmount) {
            const balance = parsedData.info.tokenAmount.uiAmount || 0;
            
            return {
              address: walletAddress,
              tokenAccount: tokenAccountAddress.toString(),
              mint: mintAddress,
              balance,
              exists: true
            };
          }
        }
      }
      
      // If we get here, account exists but couldn't parse balance
      return {
        address: walletAddress,
        tokenAccount: tokenAccountAddress.toString(),
        mint: mintAddress,
        balance: 0,
        exists: true,
        error: 'Could not parse token balance'
      };
    } catch (error) {
      // Account likely doesn't exist
      return {
        address: walletAddress,
        tokenAccount: tokenAccountAddress.toString(),
        mint: mintAddress,
        balance: 0,
        exists: false
      };
    }
  }
  
  /**
   * Derives a keypair from a mnemonic phrase
   * @param mnemonic Mnemonic phrase
   * @param derivationPath Optional derivation path (defaults to Solana's standard)
   * @returns Derived keypair
   */
  deriveKeypairFromMnemonic(mnemonic: string, derivationPath?: string) {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    // Create a seed buffer from the mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    
    // Use provided path or default
    const path = derivationPath || `m/44'/501'/0'/0'`;
    
    // Derive the key
    const derivedSeed = derivePath(path, seed.toString('hex')).key;
    
    // Generate keypair
    return Keypair.fromSeed(derivedSeed);
  }
  
  /**
   * Creates a keypair from a base64 encoded private key
   * @param privateKeyBase64 Base64 encoded private key
   * @returns Keypair
   */
  createKeypairFromPrivateKey(privateKeyBase64: string) {
    const privateKeyBytes = base64.toByteArray(privateKeyBase64);
    return Keypair.fromSecretKey(privateKeyBytes);
  }

  // Helper methods
  
  /**
   * Gets the associated token account address for a wallet and token mint
   */
  async getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const [address] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  }
  
  /**
   * Creates an instruction to create an associated token account
   */
  createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey
  ): TransactionInstruction {
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
  
  /**
   * Creates a token transfer instruction
   */
  createTransferInstruction(
    source: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: number
  ): TransactionInstruction {
    // This would typically use TokenProgram.transfer, but we're creating it manually
    // to avoid the need for the token library dependency
    const keys = [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ];
    
    // Token Program's transfer instruction (3 is the instruction index for transfer)
    const data = Buffer.from([3, ...new Uint8Array(8)]);
    
    // Write amount as a little-endian 64-bit unsigned integer
    data.writeBigUInt64LE(BigInt(amount), 1);
    
    return new TransactionInstruction({
      keys,
      programId: TOKEN_PROGRAM_ID,
      data,
    });
  }
}

// Export an instance with default configuration
export const createWalletService = (rpcUrl: string, teamMintAddress?: string) => {
  return new SolanaWalletService(rpcUrl, teamMintAddress);
};

export default SolanaWalletService; 