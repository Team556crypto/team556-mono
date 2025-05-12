# Team556 Solana Pay - Installation Guide

This document provides step-by-step instructions for installing and configuring the Team556 Solana Pay WordPress plugin.

## Prerequisites

Before installing the plugin, please ensure you have:

- WordPress 5.6 or higher
- PHP 7.4 or higher
- A Solana wallet address to receive payments
- The Team556 token mint address

## Installation Methods

### Method 1: Direct Upload (Recommended)

1. Download the plugin ZIP file from the [GitHub repository](https://github.com/team556/team556-solana-pay/releases) or the provided source.
2. Log in to your WordPress admin panel.
3. Navigate to **Plugins > Add New**.
4. Click the **Upload Plugin** button at the top of the page.
5. Choose the ZIP file you downloaded and click **Install Now**.
6. After installation completes, click **Activate Plugin**.

### Method 2: Manual Installation via FTP

1. Download and unzip the plugin to your local computer.
2. Connect to your server using an FTP client.
3. Navigate to the `/wp-content/plugins/` directory on your server.
4. Upload the entire `team556-solana-pay` folder to the plugins directory.
5. Log in to your WordPress admin panel.
6. Go to the Plugins section and click **Activate** under "Team556 Solana Pay".

## Configuration

After activation, follow these steps to configure the plugin:

1. Navigate to **Team556 Pay > Settings** in your WordPress admin menu.
2. Enter your **Solana Wallet Address** where you'll receive payments.
3. Enter the **Team556 Token Mint Address**.
4. Select the appropriate **Solana Network** (Mainnet for live transactions, Devnet or Testnet for testing).
5. Customize display settings as needed (button text, colors, messages).
6. Click **Save Changes**.

## WooCommerce Integration (Optional)

If you're using WooCommerce and want to add Team556 Solana Pay as a payment gateway:

1. Ensure WooCommerce is installed and activated.
2. Go to **WooCommerce > Settings > Payments**.
3. Find "Team556 Token (Solana Pay)" in the list of payment methods.
4. Toggle the switch to enable it.
5. Click **Set up** to configure additional gateway-specific settings.
6. Save your changes.

## Adding Payment Buttons to Pages

You can add Team556 token payment buttons to any page or post using the shortcode:

```
[team556_solana_pay amount="10" description="My Product" button_text="Pay Now" success_url="https://example.com/success" cancel_url="https://example.com/cancel"]
```

### Shortcode Attributes:

- `amount`: The amount to charge (in USD, will be converted to Team556 tokens)
- `description`: Description of what the payment is for
- `button_text`: Text to display on the payment button
- `success_url`: URL to redirect to on successful payment
- `cancel_url`: URL to redirect to if payment is cancelled

## Troubleshooting

If you encounter any issues during installation:

1. Ensure your server meets the minimum requirements (WordPress 5.6+, PHP 7.4+).
2. Check that the plugin directory has proper permissions (usually 755).
3. Verify that your Solana wallet address and token mint address are correct.
4. If using WooCommerce, ensure it's updated to the latest version.
5. Check the WordPress error log for any specific error messages.

## Support

For additional support:

- Visit the [official documentation](https://team556.com/docs)
- Open an issue on the [GitHub repository](https://github.com/team556/team556-solana-pay/issues)
- Contact support at support@team556.com 