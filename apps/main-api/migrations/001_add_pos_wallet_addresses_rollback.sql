-- Rollback Migration: Remove POS wallet address fields from users table
-- Created: 2025-10-12
-- Purpose: Rollback the addition of POS wallet address fields

-- Remove indexes first
DROP INDEX IF EXISTS idx_users_secondary_wallet;
DROP INDEX IF EXISTS idx_users_primary_wallet;

-- Remove columns
ALTER TABLE users DROP COLUMN IF EXISTS secondary_wallet_address;
ALTER TABLE users DROP COLUMN IF EXISTS primary_wallet_address;