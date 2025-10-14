-- Migration: Referral system (referral codes, referrals tracking, statistics)
-- Created: 2025-10-14
-- Purpose: Enable users to refer new users and track referral performance including Team556 token adoption

-- 1) Add referral fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code_generated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ NULL;

-- Create indexes for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_user_id) WHERE referred_by_user_id IS NOT NULL;

-- 2) Referrals table - tracks individual referral relationships and their status
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  
  -- Core referral relationship
  referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code_used VARCHAR(12) NOT NULL,
  
  -- Referral progression tracking
  email_verified_at TIMESTAMPTZ NULL,
  wallet_created_at TIMESTAMPTZ NULL,
  first_team556_balance_detected_at TIMESTAMPTZ NULL,
  first_team556_purchase_amount NUMERIC(20,9) NULL, -- Solana token precision
  current_team556_balance NUMERIC(20,9) NULL DEFAULT 0,
  last_balance_check_at TIMESTAMPTZ NULL,
  
  -- Additional metadata
  signup_ip VARCHAR(64) NULL,
  conversion_source VARCHAR(64) NULL, -- e.g., 'mobile_app', 'web', 'social_share'
  
  -- Ensure one referral record per referred user
  CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

-- Create indexes for referral queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code_used);
CREATE INDEX IF NOT EXISTS idx_referrals_email_verified ON referrals(email_verified_at) WHERE email_verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_wallet_created ON referrals(wallet_created_at) WHERE wallet_created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_team556_detected ON referrals(first_team556_balance_detected_at) WHERE first_team556_balance_detected_at IS NOT NULL;

-- 3) Referral statistics cache table - for fast dashboard queries
CREATE TABLE IF NOT EXISTS referral_stats (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic referral counts
  total_referrals INTEGER NOT NULL DEFAULT 0,
  verified_referrals INTEGER NOT NULL DEFAULT 0,
  wallet_created_referrals INTEGER NOT NULL DEFAULT 0,
  team556_holding_referrals INTEGER NOT NULL DEFAULT 0,
  
  -- Financial metrics
  total_team556_volume_referred NUMERIC(20,9) NOT NULL DEFAULT 0,
  average_team556_balance_referred NUMERIC(20,9) NOT NULL DEFAULT 0,
  
  -- Performance metrics
  conversion_rate_to_verified NUMERIC(5,4) NOT NULL DEFAULT 0, -- e.g., 0.8500 = 85%
  conversion_rate_to_wallet NUMERIC(5,4) NOT NULL DEFAULT 0,
  conversion_rate_to_team556 NUMERIC(5,4) NOT NULL DEFAULT 0,
  
  -- Timestamps
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_referral_at TIMESTAMPTZ NULL,
  most_recent_referral_at TIMESTAMPTZ NULL,
  
  -- Ensure one stats record per user
  CONSTRAINT unique_user_stats UNIQUE (user_id)
);

-- Create indexes for referral stats queries
CREATE INDEX IF NOT EXISTS idx_referral_stats_user_id ON referral_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_stats_total_referrals ON referral_stats(total_referrals);
CREATE INDEX IF NOT EXISTS idx_referral_stats_team556_referrals ON referral_stats(team556_holding_referrals);

-- 4) Referral events log - for detailed tracking and analytics
CREATE TABLE IF NOT EXISTS referral_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  referral_id BIGINT NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL, -- 'signup', 'email_verified', 'wallet_created', 'first_team556', 'balance_updated'
  
  -- Event-specific data
  previous_value NUMERIC(20,9) NULL, -- For balance updates
  new_value NUMERIC(20,9) NULL,      -- For balance updates
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- External system references
  transaction_signature VARCHAR(88) NULL, -- Solana transaction signature if applicable
  block_slot BIGINT NULL                   -- Solana block slot if applicable
);

-- Create indexes for referral events
CREATE INDEX IF NOT EXISTS idx_referral_events_referral_id ON referral_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_event_type ON referral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_events_created_at ON referral_events(created_at);

-- Add comments for documentation
COMMENT ON COLUMN users.referral_code IS 'Unique referral code generated for this user to share with others';
COMMENT ON COLUMN users.referred_by_user_id IS 'ID of the user who referred this user (nullable)';
COMMENT ON COLUMN users.referral_code_generated_at IS 'When the referral code was first generated for this user';
COMMENT ON COLUMN users.referred_at IS 'When this user signed up using a referral code';

COMMENT ON TABLE referrals IS 'Tracks individual referral relationships and their conversion progress';
COMMENT ON TABLE referral_stats IS 'Cached statistics for fast dashboard queries - updated by n8n workflows';
COMMENT ON TABLE referral_events IS 'Detailed event log for referral progression analytics';