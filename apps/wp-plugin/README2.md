# Team556 Solana Pay WordPress Plugin (Comprehensive Guide)

## 1. Overview

The Team556 Solana Pay WordPress Plugin enables WordPress sites to accept payments using the Solana blockchain via the Solana Pay protocol. It allows customers to pay for products or services by scanning a QR code with a Solana Pay-compatible wallet.

This plugin is part of the Team556 monorepo and acts as a client to the `main-api` service, which in turn proxies requests to the `solana-api` for generating Solana Pay transaction URLs.

**Key Functionality:**
- Displays a "Pay with Solana" button on specified WordPress pages/posts (currently via shortcode or direct function call).
- Initiates payment requests by communicating with backend services (`main-api` -> `solana-api`).
- Renders a QR code for the Solana Pay transaction.
- Provides an admin settings page for configuration.

**IMPORTANT:** This plugin currently only handles the *initiation* of a Solana Pay transaction. The logic to *confirm* the payment on the blockchain and update the order status in WordPress is a critical next step and is **not yet implemented** (see section "Critical Next Steps: Payment Confirmation").

## 2. Prerequisites

- **WordPress Installation:** A working WordPress site (version 5.0 or higher recommended).
- **PHP:** Version 7.4 or higher.
- **Team556 Backend Services:** 
    - The `main-api` (Go Fiber) must be running and accessible from the WordPress server's network.
    - The `solana-api` (NodeJS Express) must be running and accessible from the `main-api` server's network.
- **Environment Variable Access:** Your WordPress hosting environment must allow PHP to access environment variables (e.g., via `getenv()`) or you must define constants directly in `wp-config.php`.
- **jQuery:** Typically included with WordPress.
- **QR Code Library:** The plugin uses `qrcode-styling` (currently loaded via CDN, can be bundled locally).

## 3. Development Setup

### 3.1. Plugin Location

The plugin source code is located within the monorepo at: `apps/wp-plugin/`

### 3.2. Environment Variables & Configuration

For the plugin to communicate with the backend, specific configurations are needed:

**A. WordPress PHP Environment:**
   The plugin's PHP code needs to know the URL of your `main-api` payment endpoint and Alchemy API key for price fetching.
   
   **1. Main API URL Configuration:**
   - **Variable Name:** `TEAM556_MAIN_API_PAYMENT_URL`
   - **Expected Value:** The full URL to your `main-api`'s `/api/v1/solana/payment-request` endpoint (e.g., `http://localhost:3000/api/v1/solana/payment-request` for local development).
   
   **2. Alchemy API Key Configuration:**
   - **Variable Name:** `TEAM556_ALCHEMY_API_KEY` or `GLOBAL__ALCHEMY_API_KEY`
   - **Expected Value:** Your Alchemy API key for fetching token prices (e.g., `alcht_XfC06RTw4Rfydwbx6CnK9zazC2GEfS`)
   
   **How to Set Both:**
     1. **Recommended for Production:** Set as server-level environment variables (e.g., in Apache/Nginx config, or cPanel/Plesk).
     2. **Alternative (wp-config.php):** Define them as constants in your `wp-config.php` file before the `/* That's all, stop editing! Happy publishing. */` line:
        ```php
        define('TEAM556_MAIN_API_PAYMENT_URL', 'YOUR_MAIN_API_PAYMENT_REQUEST_ENDPOINT_URL');
        define('TEAM556_ALCHEMY_API_KEY', 'YOUR_ALCHEMY_API_KEY');
        ```
     3. **Plugin Settings Page:** The Main API URL can also be configured via the plugin's admin settings page (Options > Team556 Solana Pay > Main API URL). The environment variable/constant takes precedence if set.

**B. Main API (`apps/main-api`) Environment (`.env` file):**
   The `main-api` needs to know how to reach the `solana-api` and how to authenticate with it.
   - `SOLANA_API_PAYMENT_URL`: Full URL to the `solana-api`'s `/api/v1/pay` endpoint (e.g., `http://localhost:4000/api/v1/pay`).
   - `SOLANA_API_INTERNAL_KEY`: A strong, unique secret key that `main-api` will send in the `X-Internal-Api-Key` header to `solana-api`.
     Example `.env` entries for `main-api`:
     ```env
     SOLANA_API_PAYMENT_URL=http://localhost:4000/api/v1/pay
     SOLANA_API_INTERNAL_KEY="YOUR_SHARED_SECRET_KEY_HERE"
     ```

**C. Solana API (`apps/solana-api`) Environment (`.env` file):**
   The `solana-api` needs to verify the secret key sent by `main-api`.
   - `INTERNAL_API_SECRET`: The secret key `solana-api` expects in the `X-Internal-Api-Key` header. **This value MUST match `SOLANA_API_INTERNAL_KEY` from the `main-api`'s `.env` file.**
     Example `.env` entry for `solana-api`:
     ```env
     INTERNAL_API_SECRET="YOUR_SHARED_SECRET_KEY_HERE"
     ```

### 3.3. Build Steps

- **PHP:** No Composer dependencies are currently used directly by this plugin. Standard PHP files are used.
- **JavaScript:** `assets/js/team556-public.js` is plain JavaScript. No build step (like Webpack or Parcel) is currently configured. If JS dependencies or transpilation are added, a build process will be needed.
- **CSS:** `assets/css/team556-admin.css` is plain CSS.

### 3.4. Activation

1. Ensure the plugin files are in your WordPress `wp-content/plugins/` directory (e.g., `wp-content/plugins/team556-solana-pay`).
2. Navigate to 'Plugins' in your WordPress admin dashboard.
3. Find 'Team556 Solana Pay' and click 'Activate'.

## 4. Key Components and Functionality

- **`team556-solana-pay.php`:** 
    - Main plugin file.
    - Handles plugin activation/deactivation hooks.
    - Enqueues scripts and styles.
    - Defines the shortcode `[team556_solana_pay_button]`.
    - Registers AJAX actions for WordPress (`wp_ajax_team556_create_payment_request` and `wp_ajax_nopriv_team556_create_payment_request`).
    - Contains the `team556_handle_create_payment_request()` PHP function which:
        - Receives data from the frontend JS (amount, currency, reference, etc.).
        - Validates input.
        - Retrieves the `main-api` URL (from env/constant or WP settings).
        - Makes a POST request to the `main-api`'s `/api/v1/solana/payment-request` endpoint.
        - Returns the `solana_pay_url` (or an error) to the frontend JS.

- **`includes/admin/class-team556-solana-pay-settings.php`:**
    - Manages the plugin's settings page in the WordPress admin area (Options > Team556 Solana Pay).
    - Allows administrators to set the Merchant Wallet Address, Default Network, and the Main API URL.

- **`includes/admin/class-team556-solana-pay-admin.php`:**
    - Handles the registration of admin menu items and pages.

- **`assets/js/team556-public.js`:**
    - Handles frontend interactions.
    - Attaches an event listener to elements with the class `team556-solana-pay-button`.
    - On button click, gathers payment details (amount, reference, etc.) from data attributes.
    - Sends an AJAX POST request to WordPress's `admin-ajax.php` targeting the `team556_create_payment_request` action.
    - On successful response, receives the `solana_pay_url`.
    - Uses the `QRCodeStyling` library to render the Solana Pay URL as a QR code.
    - Displays error messages if the AJAX call fails or the backend returns an error.

- **`assets/css/team556-admin.css`:** Styles for the admin settings page.

### Payment Initiation Flow:

1. **User Click (Frontend JS):** User clicks the "Pay with Solana" button.
2. **AJAX to WP Backend (Frontend JS -> WP PHP):** `team556-public.js` sends payment details to `admin-ajax.php` (action: `team556_create_payment_request`).
3. **Request to Main API (WP PHP -> Main API):** `team556_handle_create_payment_request()` in PHP POSTs the details to `main-api`'s `/api/v1/solana/payment-request` endpoint.
4. **Proxy to Solana API (Main API -> Solana API):** `main-api` validates, adds an internal API key (`X-Internal-Api-Key`), and POSTs to `solana-api`'s `/api/v1/pay` endpoint.
5. **URL Generation (Solana API):** `solana-api` verifies the internal API key, uses `@solana/pay` to generate the Solana Pay URL.
6. **Response to Main API (Solana API -> Main API):** `solana-api` returns `{ "solana_pay_url": "..." }`.
7. **Response to WP Backend (Main API -> WP PHP):** `main-api` forwards this response.
8. **Response to Frontend JS (WP PHP -> Frontend JS):** PHP echoes this JSON response.
9. **QR Code Display (Frontend JS):** `team556-public.js` receives the URL and displays the QR code.

## 5. Configuration (WordPress Admin)

Access the plugin settings via **Options > Team556 Solana Pay** in your WordPress admin dashboard.

- **Merchant Wallet Address:** Your Solana wallet public key where payments will be received (e.g., `YOUR_SOLANA_WALLET_ADDRESS`).
- **Default Network:** The Solana network to use (e.g., `mainnet-beta` or `devnet`). The `solana-api` expects this.
- **Main API URL:** The URL of your `main-api`'s payment request endpoint (e.g., `http://localhost:3000/api/v1/solana/payment-request`). If `TEAM556_MAIN_API_PAYMENT_URL` is set as an environment variable or constant in `wp-config.php`, that value will be used instead of this setting.
- **Button Label:** Text displayed on the payment button (e.g., "Pay with Solana").
- **QR Code Size:** Size of the generated QR code in pixels.

## 6. Deployment

### 6.1. Packaging

1. Create a ZIP archive of the plugin directory (`apps/wp-plugin/`). Ensure the directory structure within the ZIP has `team556-solana-pay.php` at the root level of the archive's main folder (e.g., `team556-solana-pay/team556-solana-pay.php`).

### 6.2. Installation on Live Site

1. Log in to your WordPress admin dashboard.
2. Go to **Plugins > Add New**.
3. Click **Upload Plugin**.
4. Choose the ZIP file you created and click **Install Now**.
5. After installation, click **Activate Plugin**.

### 6.3. Server-Side Configuration (Live Server)

**Crucial:** Ensure the `TEAM556_MAIN_API_PAYMENT_URL` environment variable (or `wp-config.php` constant) is correctly set on your live server to point to your *production* `main-api` endpoint. Also ensure your production `main-api` and `solana-api` have their respective environment variables (`SOLANA_API_PAYMENT_URL`, `SOLANA_API_INTERNAL_KEY`, `INTERNAL_API_SECRET`) configured for the production environment and that the shared secrets match.

## 7. Backend Service Dependencies

This plugin **will not function** without its backend services running and correctly configured.

- **`main-api` (Go Fiber - `apps/main-api`):**
    - **Role:** Acts as a proxy, security layer, and business logic handler between the WordPress plugin and the `solana-api`.
    - **Must be running and network-accessible** from the WordPress server.
    - **Key Environment Variables (.env for `main-api`):
        - `SOLANA_API_PAYMENT_URL`: Points to the `solana-api`'s `/api/v1/pay` endpoint.
        - `SOLANA_API_INTERNAL_KEY`: Shared secret for authenticating with `solana-api`.
        - `PORT`: Port `main-api` listens on (e.g., 3000).

- **`solana-api` (NodeJS Express - `apps/solana-api`):**
    - **Role:** Generates the actual Solana Pay transaction URL using the `@solana/pay` library.
    - **Must be running and network-accessible** from the `main-api` server.
    - **Key Environment Variables (.env for `solana-api`):
        - `INTERNAL_API_SECRET`: Shared secret to validate requests from `main-api` (must match `SOLANA_API_INTERNAL_KEY` in `main-api`).
        - `PORT`: Port `solana-api` listens on (e.g., 4000).

## 8. Troubleshooting

- **QR Code Not Appearing / Button Does Nothing:**
    - Open your browser's developer console (usually F12). Check for JavaScript errors in `team556-public.js` or network errors (4xx, 5xx) related to `admin-ajax.php`.
    - Verify the `TEAM556_MAIN_API_PAYMENT_URL` is correctly set and accessible from your WordPress server.
    - Check logs for `main-api` and `solana-api` for any errors during request processing.
- **WordPress AJAX Error (e.g., returns 0 or HTML page):**
    - Ensure `WP_DEBUG` and `WP_DEBUG_LOG` are enabled in `wp-config.php` to check for PHP errors.
    - Verify the AJAX action names (`team556_create_payment_request`) match in `team556-public.js` and `team556-solana-pay.php`.
- **"Unauthorized" or "Forbidden" Errors from APIs:**
    - Double-check that `SOLANA_API_INTERNAL_KEY` in `main-api`'s `.env` and `INTERNAL_API_SECRET` in `solana-api`'s `.env` **match exactly**.
    - Ensure `main-api` is correctly sending the `X-Internal-Api-Key` header.
- **"Internal Server Error" / 500 Errors:**
    - Check the logs of the specific API (`main-api` or `solana-api`) that is returning the 500 error for detailed stack traces or error messages.

## 9. Critical Next Steps: Payment Confirmation

The current implementation **only generates the Solana Pay QR code**. It **DOES NOT** confirm if the payment was successful on the Solana blockchain or update the order status in WordPress.

**This is a CRITICAL missing piece for a functional payment gateway.**

To implement payment confirmation, you will typically need:

1.  **A Unique Reference:** The `reference` string currently sent through the APIs is essential. This should be tied to a specific order or transaction ID in WordPress.
2.  **Confirmation Mechanism:** Choose one or a combination of:
    *   **Client-Side Polling (Less Robust):** The frontend JavaScript, after displaying the QR code, could periodically poll an endpoint (e.g., in `main-api` or a new WP AJAX action) that checks the Solana transaction status using the `reference`.
    *   **Server-Side Polling / Cron Job (More Robust for WP):** A WordPress cron job could periodically query the `main-api` (or directly the Solana RPC via `solana-api`) for the status of pending transactions based on their references.
    *   **Webhooks (Most Robust, Complex):** If the `solana-api` (or a dedicated transaction monitoring service) can monitor the blockchain for transactions related to the generated payment requests, it could send a webhook to an endpoint on `main-api` or directly to a new endpoint in the WordPress plugin. This is the most event-driven approach.
3.  **New API Endpoints:**
    *   **`main-api`:** Might need an endpoint for WordPress to query transaction status by reference (e.g., `/api/v1/solana/transaction-status/:reference`). This endpoint would then query the `solana-api`.
    *   **`solana-api`:** Needs logic to query the Solana blockchain (using the `reference` as a transaction memo or by finding transactions to the merchant wallet around the time of payment) to confirm payment details (recipient, amount, SPL token if applicable).
    *   **WordPress:** Might need a new AJAX action or a webhook listener to receive confirmation updates.
4.  **Update Order Status:** Once a payment is confirmed, the plugin needs to update the order status in WordPress (e.g., to 'Processing' or 'Completed'). If using WooCommerce, this involves using WooCommerce hooks and functions.

**Considerations for Confirmation:**
- **SPL Tokens vs. SOL:** The confirmation logic needs to handle whether the payment was for native SOL or a specific SPL token (e.g., USDC), including checking the correct amount and token type.
- **Transaction Finality:** Ensure you wait for sufficient transaction finality on Solana before considering a payment confirmed.
- **Error Handling:** What happens if a payment is underpaid, overpaid, or sent in the wrong token?

## 10. Future Enhancements / TODOs

- **Implement Payment Confirmation (see section 9 - CRITICAL).**
- **WooCommerce Integration:** Convert the plugin into a proper WooCommerce payment gateway for seamless integration with WooCommerce checkout.
- **Internationalization (i18n):** Make all user-facing strings translatable.
- **Automated Tests:** PHPUnit tests for PHP logic, JavaScript tests for frontend interactions.
- **Improved Error Handling & User Feedback:** More specific and user-friendly error messages on the frontend.
- **Bundling Assets:** Bundle JS (and potentially CSS) locally instead of relying on CDNs for QR code library.
- **Security Hardening:** Sanitize all inputs rigorously, consider nonce usage more deeply for AJAX actions.
- **Customizable Button Appearance:** More options for styling the payment button via admin settings.
