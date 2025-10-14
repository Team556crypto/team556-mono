-- Migration: Security core (MFA fields, recovery codes, sessions, login activity, audit logs)
-- Created: 2025-10-14

-- 1) Users: MFA and password metadata
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT NULL,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NULL;

-- 2) MFA Recovery Codes
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON mfa_recovery_codes(user_id);

-- 3) User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip VARCHAR(64),
  user_agent VARCHAR(512),
  location VARCHAR(128),
  last_seen_at TIMESTAMPTZ NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  token_id VARCHAR(64) NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON user_sessions(token_id);

-- 4) Login Activity
CREATE TABLE IF NOT EXISTS login_activities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  ip VARCHAR(64),
  user_agent VARCHAR(512),
  location VARCHAR(128)
);
CREATE INDEX IF NOT EXISTS idx_login_activities_user_id ON login_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activities_status ON login_activities(status);

-- 5) Security Audit Logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  ip VARCHAR(64),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs(action);
