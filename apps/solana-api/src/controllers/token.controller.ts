import { Request, Response } from 'express'
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'

const TEAM_TOKEN_MINT_ADDRESS = process.env.GLOBAL__TEAM_MINT
const RPC_URL = process.env.GLOBAL__MAINNET_RPC_URL
const TREASURY_SECRET_KEY_B58 = process.env.GLOBAL__TREASURY_KEYPAIR
const MINT_DECIMALS = parseInt(process.env.EXPO_PUBLIC_GLOBAL__MINT_DECIMALS || '9', 10)

export const airdropTokens = async (req: Request, res: Response) => {
  const { recipientAddress } = req.body
  const amountToAirdrop = 500000 // Fixed amount for P1P1 claim

  if (!recipientAddress) {
    return res.status(400).json({ message: 'Recipient address is required' })
  }

  if (!RPC_URL || !TEAM_TOKEN_MINT_ADDRESS || !TREASURY_SECRET_KEY_B58) {
    console.error(
      'Missing environment variables for airdrop: RPC_URL, TEAM_TOKEN_MINT_ADDRESS, or GLOBAL__TREASURY_KEYPAIR'
    )
    return res.status(500).json({ message: 'Server configuration error for airdrop' })
  }

  try {
    const connection = new Connection(RPC_URL, 'confirmed')

    let treasuryKeypair: Keypair
    try {
      // Assuming GLOBAL__TREASURY_KEYPAIR is a string like "[10,23,45,...]"
      const secretKeyArray: number[] = JSON.parse(TREASURY_SECRET_KEY_B58)
      if (!Array.isArray(secretKeyArray) || !secretKeyArray.every(num => typeof num === 'number')) {
        throw new Error('GLOBAL__TREASURY_KEYPAIR is not a valid array of numbers.')
      }
      const secretKeyBytes = Uint8Array.from(secretKeyArray)
      treasuryKeypair = Keypair.fromSecretKey(secretKeyBytes)
    } catch (error) {
      console.error('Failed to parse/decode treasury secret key or create keypair:', error)
      return res.status(500).json({ message: 'Invalid treasury keypair configuration.' })
    }

    const mintPublicKey = new PublicKey(TEAM_TOKEN_MINT_ADDRESS)
    const recipientPublicKey = new PublicKey(recipientAddress)

    // Get or create the source (treasury) token account
    const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair, // Payer
      mintPublicKey,
      treasuryKeypair.publicKey
    )

    // Get or create the destination (recipient) token account
    const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair, // Payer (treasury pays for ATA creation if needed)
      mintPublicKey,
      recipientPublicKey
    )

    const transaction = new Transaction().add(
      createTransferInstruction(
        sourceTokenAccount.address,
        destinationTokenAccount.address,
        treasuryKeypair.publicKey,
        amountToAirdrop * Math.pow(10, MINT_DECIMALS), // Amount in atomic units
        [],
        TOKEN_PROGRAM_ID
      )
    )

    const signature = await sendAndConfirmTransaction(connection, transaction, [treasuryKeypair])

    return res.status(200).json({ message: 'Airdrop successful', signature })
  } catch (error: any) {
    console.error('Airdrop failed:', error)
    return res.status(500).json({ message: 'Airdrop failed', error: error.message })
  }
}
