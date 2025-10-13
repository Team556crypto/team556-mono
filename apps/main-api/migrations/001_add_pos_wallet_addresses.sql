-- Migration: Add POS wallet address fields to users table
-- Created: 2025-10-12
-- Purpose: Allow users to configure primary and secondary wallet addresses for POS payments

-- Add primary wallet address column (required, max 44 chars for Solana addresses)
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_wallet_address VARCHAR(44) DEFAULT '';

-- Add secondary wallet address column (optional, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_wallet_address VARCHAR(44) DEFAULT NULL;

-- Create index for faster lookup by primary wallet address
CREATE INDEX IF NOT EXISTS idx_users_primary_wallet ON users(primary_wallet_address);

-- Create partial index for secondary wallet addresses (only non-null values)
CREATE INDEX IF NOT EXISTS idx_users_secondary_wallet ON users(secondary_wallet_address) WHERE secondary_wallet_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.primary_wallet_address IS 'Primary Solana wallet address for receiving POS payments';
COMMENT ON COLUMN users.secondary_wallet_address IS 'Optional secondary Solana wallet address for receiving POS payments';