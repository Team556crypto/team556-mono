import { Request, Response } from 'express'
import { Keypair } from '@solana/web3.js'
import * as bip39 from 'bip39'

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
