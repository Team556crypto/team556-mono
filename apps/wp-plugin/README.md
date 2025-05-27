# Team556 Solana Pay WordPress Plugin

A WordPress plugin that enables merchants to accept Team556 tokens using Solana Pay. This plugin integrates with your WordPress site and WooCommerce store to provide a seamless cryptocurrency payment experience.

## Features

- Accept Team556 tokens as payment for WooCommerce orders
- Standalone payment button via shortcode for any page or post
- Admin settings page for easy configuration
- Compatible with Team556 merchant application (Tauri/Vue/Tailwind)
- Support for Solana Mainnet, Devnet, and Testnet
- Payment verification via Solana blockchain
- Responsive design

## Requirements

- WordPress 5.6 or higher
- PHP 7.4 or higher
- WooCommerce 4.0+ (optional, for store integration)
- Solana wallet (like Phantom) for customers

## Installation

1. Download the plugin zip file or clone the repository
2. Upload to your WordPress site's plugins directory (`/wp-content/plugins/`)
3. Activate the plugin through the 'Plugins' menu in WordPress
4. Configure your wallet address and token details in the plugin settings

## Configuration

1. Navigate to WordPress admin → Settings → Team556 Solana Pay
2. Enter your Solana wallet address where you want to receive payments
3. Enter the Team556 token mint address
4. Select the appropriate Solana network (Mainnet, Devnet, or Testnet)
5. Save changes

## Usage

### WooCommerce Integration

Once activated and configured, Team556 Solana Pay will appear as a payment method during WooCommerce checkout. Customers can select it and complete their payment using their Solana wallet.

### Shortcode Usage

You can embed a payment button on any page or post using the following shortcode:

```
[team556_solana_pay amount="10" description="My Product" button_text="Pay Now" success_url="https://example.com/success" cancel_url="https://example.com/cancel"]
```

#### Shortcode Attributes

- `amount`: The amount to charge (in USD, will be converted to Team556 tokens)
- `description`: Description of what the payment is for
- `button_text`: Text to display on the payment button
- `success_url`: URL to redirect to on successful payment
- `cancel_url`: URL to redirect to if payment is cancelled

## Technical Information

### Integration with Team556 Merchant App

This plugin is designed to work alongside the Team556 merchant application built with Tauri/Vue/Tailwind. It provides the WordPress/WooCommerce side of the payment processing, while maintaining compatibility with the merchant application's UI and functionality.

### JavaScript Dependencies

- Solana Web3.js library (loaded from CDN)
- jQuery (provided by WordPress)

### CSS 

The plugin includes Tailwind-inspired utility classes for UI consistency with the Team556 merchant application.

## Development

### Directory Structure

```
team556-solana-pay/
├── assets/
│   ├── css/
│   │   └── team556-solana-pay.css
│   ├── js/
│   │   └── team556-solana-pay.js
│   └── images/
│       └── solana-logo.png
├── includes/
│   ├── admin/
│   │   └── class-team556-solana-pay-admin.php
│   ├── class-team556-solana-pay.php
│   └── class-team556-solana-pay-gateway.php
├── team556-solana-pay.php
└── README.md
```

## Security Considerations

- Always verify transactions on the Solana blockchain before marking orders as complete
- Use HTTPS for your WordPress site to secure payment data
- Keep the plugin and WordPress core updated to the latest versions

## Support

For issues, feature requests, or contributions, please submit them to the GitHub repository.

## License

This plugin is licensed under the GPL v2 or later.

---

Built with 💜 for Team556 