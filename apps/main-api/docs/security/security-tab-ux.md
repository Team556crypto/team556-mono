Security Tab — UX Scope and States

Purpose
- Define the exact sections, UI states, interactions, and acceptance criteria for the Security tab, aligned with the provided mock screenshot.
- This doc is implementation-ready for both backend contracts (to be defined in step 2) and frontend UI.

Information architecture (cards/sections)
1) Security Settings (Account Protection)
   - Elements
     - Account Protection progress bar with percentage (0–100%).
     - Status pill at top-right of the card: Good, Fair, At Risk.
     - Last Password Change: X days ago.
     - Recommendation line: “We recommend changing your password every 30 days.”
   - Visual cues
     - Good ≥ 70% (green), Fair 40–69% (yellow), At Risk < 40% (red).
     - Subtle check/x indicators for contributing factors (e.g., 2FA enabled, strong password).
   - Actions
     - None directly on this card besides informational hints; recommendations may link to actions (Enable 2FA, Change password).

2) Two‑Factor Authentication (TOTP)
   - Elements
     - Section title: Two‑Factor Authentication.
     - Status chip at right: Enabled/Disabled.
     - Primary action: Setup 2FA (shown when disabled).
     - When enabled, surface Manage dropdown (or inline actions): Disable 2FA, Rotate recovery codes, Add backup method (future).
     - Helper text: “Two‑factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.”
   - Flows
     - Setup 2FA opens a modal with: QR code, secret fallback, 6‑digit code input, Verify/Enable CTA, then show recovery codes with copy/download.
     - Disable 2FA requires current TOTP or a recovery code and a confirm step.

3) Recent Login Activity
   - Elements
     - Title: Recent Login Activity, subtitle: “Monitor your account access”.
     - View All button (top-right) navigates to a full sessions page.
     - List shows up to 3 recent entries.
       - Row contents: left status indicator, title (Successful Login / Failed Login), timestamp (“Today, 10:45 AM”), secondary meta (“San Francisco, CA — Chrome”), pill “Current” for the active session, right-aligned IP tag (e.g., IP: 192.168.x.x).
     - Hover action (non-current rows): Revoke session (optional for phase 1; can be part of sessions page).
   - Visual cues
     - Success rows: green accent. Failure rows (if shown): red accent. Older success: neutral/yellow accent as in mock.
   - Empty state
     - “No recent activity yet.” with subdued illustration/placeholder.

4) Password Settings
   - Elements
     - Title: Password Settings
     - Primary action: Change Password
   - Change Password flow (modal)
     - Fields: Current password, New password, Confirm new password.
     - Live strength meter and rule checklist (min length, complexity, no common/compromised entries).
     - Submit disables controls, shows spinner, success toast on completion.

5) Sticky Action Bar (page footer)
   - Elements
     - Cancel (secondary) and Save Changes (primary).
   - Behavior
     - Save is disabled when there are no pending page-level changes.
     - 2FA setup/disable and Change Password commit immediately (not gated by Save).
     - Cancel reverts unsaved page-level preference changes (if added later) and resets UI.

Global page structure
- Left rail: Settings nav with “Security” active.
- Right content column contains the cards above in this order: Security Settings, Two‑Factor Authentication, Recent Login Activity, Password Settings, then the sticky action bar.

States matrix (per card)
- Loading
  - Skeletons for each card: bars for progress, chips for status, 3 placeholder rows for activity, disabled buttons.
- Empty
  - Recent activity: empty state message.
- Error
  - Inline, per card. Pattern: error banner with Retry action. If a write action fails, show toast + inline form message.
- Success
  - Toasts on successful enabling/disabling 2FA, password changes, session revocation.

A11y requirements
- All interactive controls keyboard-accessible (Tab order top-to-bottom, left-to-right).
- Toggle/switch for 2FA uses role="switch" with aria-checked.
- Modals trap focus and return focus to invoking element on close.
- QR code includes alt text and text fallback (secret). Provide Copy buttons with aria-live polite confirmations.
- Color is not the only indicator: use icons/text with the status colors.

Responsive behavior
- Desktop (≥1280px): single main column, card max-width ~960–1100px.
- Tablet (≥768px): full-width cards, collapsed paddings.
- Mobile: stack cards; sticky action bar remains visible; consider collapsing long activity rows.

Content and microcopy (initial)
- Security Settings
  - Title: Security Settings
  - Status: Good | Fair | At Risk
  - Last Password Change: “Last Password Change” label with “X days ago”.
  - Recommendation: “We recommend changing your password every 30 days.”
- Two‑Factor Authentication
  - Helper: “Two‑factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.”
  - CTA: Setup 2FA | Disable 2FA | Rotate recovery codes (when enabled)
- Recent Login Activity
  - Empty: “No recent activity yet.”
  - Row titles: “Successful Login”, “Failed Login”
  - Pill: “Current”
  - Button: “View All”
- Password Settings
  - CTA: “Change Password”
- Footer
  - Buttons: “Cancel”, “Save Changes”

Interaction details
- Save Changes
  - Enabled only when page-level preferences change (none in phase 1; keep button present but disabled by default to match mock).
- Setup 2FA
  - Opens modal; Verify enables the feature and updates the status chip to Enabled; show recovery codes step before closing.
- Disable 2FA
  - Confirmation modal + code entry.
- Change Password
  - Opens modal; strong password required; on success, show toast, update “Last Password Change” and Account Protection score.
- View All
  - Navigates to Sessions page (out of scope for step 1, tracked for step 3/5).

Visual guidance (tokens — approximate; exact design system tokens may replace these)
- Colors
  - Good: green‑500; Fair: yellow‑500; At Risk: red‑500
  - IP tag: purple‑600 background, white text (as in mock)
- Spacing
  - Card padding: 24px desktop, 16px mobile
- Typography
  - Card titles: Semibold, 16–18px; Body: 14–16px

Telemetry and audit hooks (to wire later)
- Events
  - security_tab_viewed
  - mfa_setup_opened, mfa_enabled, mfa_disabled, recovery_codes_rotated
  - password_change_opened, password_changed
  - recent_login_view_all_clicked, session_revoked

Acceptance criteria checklist
- Matches card order and primary actions shown in the mock.
- Status pill and progress bar reflect a computed score with thresholds above.
- 2FA shows Disabled state with Setup 2FA button initially; Enabled state after verification.
- Recent Login Activity shows up to 3 items with Current pill and IP tag on the right; View All present.
- Password Settings exposes Change Password modal.
- Sticky footer shows Cancel and Save Changes; Save disabled when there’s nothing to save.
- Loading skeletons and per-card error handling are implemented.
- All interactive flows produce success/error toasts and are keyboard accessible.

Notes
- Documentation link shown in the left rail (“View Documentation”) can point to internal docs; include as a non-blocking link element.
- API contract: see docs/security/security-api.yaml (OpenAPI) and docs/security/security-api.md (quick reference).
- Exact copy and thresholds can be adjusted in localization/config without changing layout.
