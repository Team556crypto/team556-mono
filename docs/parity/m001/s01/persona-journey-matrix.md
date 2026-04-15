# S01 Persona Journey Matrix

This matrix defines canonical `persona_id` and `journey_id` values for tracker mapping.

## Personas
- `persona_prospect` — unauthenticated visitor evaluating Team556 value proposition.
- `persona_wallet_new_user` — user onboarding or recovering wallet access.
- `persona_wallet_member` — authenticated wallet holder.
- `persona_pos_cashier` — frontline in-store POS operator.
- `persona_pos_manager` — operations manager reviewing inventory and analytics.
- `persona_pos_admin` — owner/admin managing POS configuration.
- `persona_wp_site_admin` — WooCommerce/WordPress admin configuring plugin behavior.
- `persona_checkout_customer` — shopper completing a Team556 checkout payment.

## Journey Coverage (human-readable)
- `jrn_landing_discover_offer` — prospect explores landing narrative and proof.
- `jrn_landing_convert_to_signup` — prospect follows CTA paths toward signup.
- `jrn_wallet_complete_auth` — wallet user signs in/signs up/resets access.
- `jrn_wallet_navigate_shell` — wallet user navigates shell/fallback routes.
- `jrn_wallet_view_assets` — wallet user views portfolio and armory assets.
- `jrn_wallet_execute_payment` — wallet user scans/submits Team556 payment.
- `jrn_wallet_redeem_value` — wallet user redeems rewards/value.
- `jrn_wallet_manage_settings` — wallet user updates preferences/settings.
- `jrn_wallet_review_legal` — wallet user reviews policy/legal pages.
- `jrn_pos_complete_auth` — POS operator signs in or recovers account.
- `jrn_pos_navigate_shell` — POS operator navigates shell/fallback routes.
- `jrn_pos_process_sale` — cashier executes checkout/payment flow.
- `jrn_pos_manage_inventory` — manager updates inventory/distributors.
- `jrn_pos_monitor_performance` — manager checks analytics/dashboard status.
- `jrn_pos_configure_operations` — admin updates POS settings/security.
- `jrn_pos_review_legal` — POS team reviews policy/legal pages.
- `jrn_wp_activate_plugin` — admin installs/activates plugin bootstrap.
- `jrn_wp_configure_gateway` — admin configures Woo gateway/admin scripts.
- `jrn_wp_monitor_transactions` — admin monitors transaction status/reporting.
- `jrn_wp_collect_checkout_payment` — shopper completes checkout via plugin runtime.

## Machine Registry

```json
{
  "personas": [
    { "id": "persona_prospect" },
    { "id": "persona_wallet_new_user" },
    { "id": "persona_wallet_member" },
    { "id": "persona_pos_cashier" },
    { "id": "persona_pos_manager" },
    { "id": "persona_pos_admin" },
    { "id": "persona_wp_site_admin" },
    { "id": "persona_checkout_customer" }
  ],
  "journeys": [
    {
      "id": "jrn_landing_discover_offer",
      "primary_persona_id": "persona_prospect",
      "allowed_persona_ids": ["persona_prospect"]
    },
    {
      "id": "jrn_landing_convert_to_signup",
      "primary_persona_id": "persona_prospect",
      "allowed_persona_ids": ["persona_prospect"]
    },
    {
      "id": "jrn_wallet_complete_auth",
      "primary_persona_id": "persona_wallet_new_user",
      "allowed_persona_ids": ["persona_wallet_new_user", "persona_wallet_member"]
    },
    {
      "id": "jrn_wallet_navigate_shell",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member"]
    },
    {
      "id": "jrn_wallet_view_assets",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member"]
    },
    {
      "id": "jrn_wallet_execute_payment",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member", "persona_checkout_customer"]
    },
    {
      "id": "jrn_wallet_redeem_value",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member"]
    },
    {
      "id": "jrn_wallet_manage_settings",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member"]
    },
    {
      "id": "jrn_wallet_review_legal",
      "primary_persona_id": "persona_wallet_member",
      "allowed_persona_ids": ["persona_wallet_member", "persona_wallet_new_user"]
    },
    {
      "id": "jrn_pos_complete_auth",
      "primary_persona_id": "persona_pos_cashier",
      "allowed_persona_ids": ["persona_pos_cashier", "persona_pos_manager", "persona_pos_admin"]
    },
    {
      "id": "jrn_pos_navigate_shell",
      "primary_persona_id": "persona_pos_cashier",
      "allowed_persona_ids": ["persona_pos_cashier", "persona_pos_manager"]
    },
    {
      "id": "jrn_pos_process_sale",
      "primary_persona_id": "persona_pos_cashier",
      "allowed_persona_ids": ["persona_pos_cashier", "persona_checkout_customer"]
    },
    {
      "id": "jrn_pos_manage_inventory",
      "primary_persona_id": "persona_pos_manager",
      "allowed_persona_ids": ["persona_pos_manager", "persona_pos_admin"]
    },
    {
      "id": "jrn_pos_monitor_performance",
      "primary_persona_id": "persona_pos_manager",
      "allowed_persona_ids": ["persona_pos_manager", "persona_pos_admin"]
    },
    {
      "id": "jrn_pos_configure_operations",
      "primary_persona_id": "persona_pos_admin",
      "allowed_persona_ids": ["persona_pos_admin", "persona_pos_manager"]
    },
    {
      "id": "jrn_pos_review_legal",
      "primary_persona_id": "persona_pos_cashier",
      "allowed_persona_ids": ["persona_pos_cashier", "persona_pos_manager", "persona_pos_admin"]
    },
    {
      "id": "jrn_wp_activate_plugin",
      "primary_persona_id": "persona_wp_site_admin",
      "allowed_persona_ids": ["persona_wp_site_admin"]
    },
    {
      "id": "jrn_wp_configure_gateway",
      "primary_persona_id": "persona_wp_site_admin",
      "allowed_persona_ids": ["persona_wp_site_admin"]
    },
    {
      "id": "jrn_wp_monitor_transactions",
      "primary_persona_id": "persona_wp_site_admin",
      "allowed_persona_ids": ["persona_wp_site_admin"]
    },
    {
      "id": "jrn_wp_collect_checkout_payment",
      "primary_persona_id": "persona_checkout_customer",
      "allowed_persona_ids": ["persona_checkout_customer", "persona_wp_site_admin"]
    }
  ]
}
```
