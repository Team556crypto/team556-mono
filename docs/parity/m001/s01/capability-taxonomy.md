# S01 Capability Taxonomy

This taxonomy defines the canonical `capability_id` values used by `docs/parity/m001/s01/coverage-tracker.yaml`.

## Capability Groups

### Landing
- `cap_landing_brand_story` — marketing narrative and trust-building sections.
- `cap_landing_conversion_cta` — conversion/navigation calls-to-action.
- `cap_landing_layout_orchestration` — landing composition/export wiring.

### Wallet (consumer app)
- `cap_wallet_navigation_shell` — route shell and fallback navigation.
- `cap_wallet_identity_access` — login/signup/onboarding/reset access flows.
- `cap_wallet_asset_overview` — portfolio and digital-armory views.
- `cap_wallet_payment_execution` — Solana Pay QR/manual payment execution.
- `cap_wallet_rewards_redemption` — redeem dashboard and value redemption.
- `cap_wallet_preferences_profile` — account/profile settings management.
- `cap_wallet_legal_disclosure` — privacy/terms disclosures.

### POS (merchant app)
- `cap_pos_navigation_shell` — route shell and fallback navigation.
- `cap_pos_identity_access` — cashier/manager authentication and recovery.
- `cap_pos_checkout_execution` — in-store checkout/payment terminal flows.
- `cap_pos_inventory_distribution` — inventory/distributor operations.
- `cap_pos_reporting_insights` — analytics and dashboard monitoring.
- `cap_pos_operations_configuration` — business/security/notification settings.
- `cap_pos_legal_disclosure` — privacy/terms disclosures.

### WordPress plugin
- `cap_wp_plugin_bootstrap` — plugin bootstrap/registration lifecycle.
- `cap_wp_admin_configuration` — admin setup/configuration controls.
- `cap_wp_admin_observability` — admin dashboard and transaction tables.
- `cap_wp_checkout_gateway` — checkout gateway/payment lifecycle logic.
- `cap_wp_checkout_blocks` — block editor/checkout block registration.
- `cap_wp_frontend_runtime` — frontend checkout JS runtime behaviors.

## Machine Registry

```json
{
  "capabilities": [
    { "id": "cap_landing_brand_story", "family": "landing", "group": "marketing" },
    { "id": "cap_landing_conversion_cta", "family": "landing", "group": "marketing" },
    { "id": "cap_landing_layout_orchestration", "family": "landing", "group": "composition" },

    { "id": "cap_wallet_navigation_shell", "family": "wallet", "group": "navigation" },
    { "id": "cap_wallet_identity_access", "family": "wallet", "group": "identity" },
    { "id": "cap_wallet_asset_overview", "family": "wallet", "group": "portfolio" },
    { "id": "cap_wallet_payment_execution", "family": "wallet", "group": "payments" },
    { "id": "cap_wallet_rewards_redemption", "family": "wallet", "group": "rewards" },
    { "id": "cap_wallet_preferences_profile", "family": "wallet", "group": "settings" },
    { "id": "cap_wallet_legal_disclosure", "family": "wallet", "group": "legal" },

    { "id": "cap_pos_navigation_shell", "family": "pos", "group": "navigation" },
    { "id": "cap_pos_identity_access", "family": "pos", "group": "identity" },
    { "id": "cap_pos_checkout_execution", "family": "pos", "group": "checkout" },
    { "id": "cap_pos_inventory_distribution", "family": "pos", "group": "operations" },
    { "id": "cap_pos_reporting_insights", "family": "pos", "group": "analytics" },
    { "id": "cap_pos_operations_configuration", "family": "pos", "group": "settings" },
    { "id": "cap_pos_legal_disclosure", "family": "pos", "group": "legal" },

    { "id": "cap_wp_plugin_bootstrap", "family": "wp-plugin", "group": "bootstrap" },
    { "id": "cap_wp_admin_configuration", "family": "wp-plugin", "group": "admin" },
    { "id": "cap_wp_admin_observability", "family": "wp-plugin", "group": "admin" },
    { "id": "cap_wp_checkout_gateway", "family": "wp-plugin", "group": "checkout" },
    { "id": "cap_wp_checkout_blocks", "family": "wp-plugin", "group": "checkout" },
    { "id": "cap_wp_frontend_runtime", "family": "wp-plugin", "group": "frontend" }
  ]
}
```
