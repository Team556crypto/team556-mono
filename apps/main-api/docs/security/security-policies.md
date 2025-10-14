# Security primitives and policies

This document defines the security rules enforced by the Security tab backend. It complements the OpenAPI contract and the UX scope.

1) Passwords
- Hashing: bcrypt (default cost). Consider Argon2id for future hardening.
- Minimum policy for change endpoint:
  - At least 12 characters
  - Must include upper, lower, digit, and special character
- Strength feedback: backend exposes a coarse 0–4 score with hints (internal/security/password.go).
- Password age: `password_changed_at` updated on successful change. Score adds +10 if changed within 90 days.
- On password change: optionally invalidate other sessions (phase 1 optional; add flag later).

2) Two‑Factor Authentication (TOTP)
- Provisioning:
  - `POST /me/mfa/totp/setup` generates a secret and stores it encrypted in `users.mfa_secret_encrypted` (AES‑GCM with `MAIN_API__MFA_ENC_SECRET`).
  - Returns secret, otpauth:// URL, and a QR image data URI for convenience.
- Enabling:
  - `POST /me/mfa/totp/enable` verifies the 6‑digit code and sets `mfa_enabled=true`.
  - Generates 10 recovery codes; plaintext shown once; hashes stored in `mfa_recovery_codes`.
- Verification:
  - `POST /me/mfa/verify` accepts either a TOTP code or a recovery code.
  - Recovery codes are one‑time; marked used on success.
- Disabling:
  - `DELETE /me/mfa` requires verification (TOTP or recovery code). Clears secret and deletes recovery codes.
- TOTP params: 30s step, 6 digits, small clock skew tolerance via library defaults.

3) Sessions and activity
- `user_sessions` stores device sessions: ip, user_agent, location, last_seen_at, token_id (optional), is_revoked.
- `login_activities` records successful/failed logins for UI preview and audit.
- `security_audit_logs` records sensitive actions: password_changed, mfa_enabled, mfa_disabled, recovery_codes_rotated, session_revoked.

4) Account protection score
- Computed server‑side using internal/security/score.go:
  - MFA enabled: +60
  - Password strength: 0..30
  - Password age (<=90 days): +10
  - Recent suspicious activity: −0..20
- Status thresholds: good ≥ 70, fair 40–69, at_risk < 40.

5) Rate limiting
- Sensitive routes (password, MFA, sessions revoke) should be wrapped in a limiter, e.g., 5 req/min per IP and/or per user.
- Helper provided: internal/security/ratelimit.go.

6) Notifications (phase 1 basic)
- Send email on: password changed, MFA enabled/disabled, recovery codes rotated, new login from new device/geo (best‑effort).

7) Data protection
- TOTP secrets encrypted using AES‑GCM with `MAIN_API__MFA_ENC_SECRET`.
- Recovery codes stored as bcrypt hashes only; plaintext shown once.
- Never log secrets, codes, or tokens.

8) Error handling
- Use generic error messages for auth failures.
- Return consistent error shape: { error: { code, message, details? } } per OpenAPI.

9) Observability
- Emit structured audit logs for all sensitive actions.
- Consider metrics for failed verifications and login spikes; alert on anomalies.

Implementation references
- internal/security/mfa.go — TOTP + recovery codes
- internal/security/password.go — password strength and age scoring
- internal/security/score.go — account protection score
- internal/security/ratelimit.go — limiter helper
