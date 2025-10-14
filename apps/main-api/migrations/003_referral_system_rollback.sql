-- Rollback Migration: Referral system
-- Created: 2025-10-14
-- Purpose: Rollback referral system tables and columns

-- 1) Drop referral events table
DROP TABLE IF EXISTS referral_events CASCADE;

-- 2) Drop referral statistics table
DROP TABLE IF EXISTS referral_stats CASCADE;

-- 3) Drop referrals table
DROP TABLE IF EXISTS referrals CASCADE;

-- 4) Remove referral columns from users table
ALTER TABLE users
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by_user_id,
  DROP COLUMN IF EXISTS referral_code_generated_at,
  DROP COLUMN IF EXISTS referred_at;

-- 5) Drop indexes (PostgreSQL automatically drops indexes when columns are dropped, but being explicit)
DROP INDEX IF EXISTS idx_users_referral_code;
DROP INDEX IF EXISTS idx_users_referred_by;