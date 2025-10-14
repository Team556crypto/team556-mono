-- Rollback: Security core
-- Drops security-related tables and columns added in 002_security_core.sql
-- Created: 2025-10-14

-- 1) Drop tables in dependency-safe order
DROP TABLE IF EXISTS security_audit_logs;
DROP TABLE IF EXISTS login_activities;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS mfa_recovery_codes;

-- 2) Remove columns from users
ALTER TABLE users
  DROP COLUMN IF EXISTS password_changed_at,
  DROP COLUMN IF EXISTS mfa_secret_encrypted,
  DROP COLUMN IF EXISTS mfa_enabled;
