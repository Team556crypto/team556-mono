# Security API — Quick Reference

This document summarizes the endpoints used by the Security tab. See the full OpenAPI at `docs/security/security-api.yaml`.

Auth
- Bearer token (JWT) or session cookie.
- Standard rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` on 429.

Endpoints
1) GET /me/security — Security overview
- 200: { accountProtectionScore, status, lastPasswordChangeAt, recommendations[], passwordStrength{score,hints[]}, mfaEnabled }

2) POST /me/password — Change password
- Body: { currentPassword, newPassword, totpCode? }
- 200: { ok: true }
- Errors: 400, 401, 422

3) POST /me/mfa/totp/setup — Begin TOTP setup
- 200: { secret, otpauthUrl, qrSvg }

4) POST /me/mfa/totp/enable — Verify and enable TOTP
- Body: { code }
- 200: { mfaEnabled: true, recoveryCodes: string[] } (display once)

5) POST /me/mfa/verify — Verify code for sensitive actions
- Body: { code, purpose? }
- 200: { ok: true }

6) DELETE /me/mfa — Disable MFA
- Body: { code } // TOTP or recovery code
- 200: { ok: true }

7) POST /me/mfa/recovery/rotate — Rotate recovery codes
- 200: { recoveryCodes: string[] } (display once)

8) GET /me/sessions — List sessions
- Query: limit, cursor
- 200: { data: Session[] } + X-Next-Cursor header

9) DELETE /me/sessions/{id} — Revoke a session
- 200: { ok: true }

Data shapes
- Session: { id, createdAt, lastSeenAt?, ip, userAgent, location?, isCurrent, status }
- SecuritySummary: { accountProtectionScore: 0-100, status: good|fair|at_risk, lastPasswordChangeAt, recommendations[], passwordStrength{score:0-4,hints[]}, mfaEnabled }

Conventions
- All timestamps ISO-8601 (UTC).
- Errors: { error: { code, message, details? } }.
- Sensitive operations (password change, disable MFA, rotate recovery codes) require either a recent successful `POST /me/mfa/verify` or an inline `totpCode`/`code` body field, depending on the route.

Notes for implementation
- Enforce rate limits per IP and per user for login/MFA/password endpoints.
- Emit security audit events on: password_changed, mfa_enabled, mfa_disabled, recovery_codes_rotated, session_revoked.
- Email notifications on password/MFA changes and new-logins-from-new-geo (best-effort).
