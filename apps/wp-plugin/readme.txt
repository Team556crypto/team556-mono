=== Team556 Solana Pay ===
Contributors: team556
Tags: solana, cryptocurrency, payments, woocommerce, crypto, blockchain, token
Requires at least: 5.6
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Accept Team556 tokens on your WordPress site using Solana Pay. Seamlessly integrate with WooCommerce or use our shortcode on any page.

== Description ==

Team556 Solana Pay enables your WordPress site to accept Team556 tokens via Solana Pay. This plugin offers a seamless cryptocurrency payment experience for your customers, with or without WooCommerce.

### Key Features

* **Accept Team556 Tokens** - Allow your customers to pay with Team556 tokens directly from their Solana wallet
* **Solana Pay Integration** - Utilize the Solana Pay protocol for secure and efficient transactions
* **Beautiful User Interface** - Modern, responsive design that works on all devices
* **WooCommerce Compatible** - Works as a payment gateway in WooCommerce checkout
* **Shortcode Support** - Add payment buttons to any page or post
* **Complete Dashboard** - Track all transactions from your WordPress admin area
* **Customizable** - Change button colors, text, and messages to match your brand
* **Multiple Networks** - Support for Mainnet, Devnet, and Testnet

### Seamless Integration

Team556 Solana Pay is designed to work with your existing WordPress site and integrates perfectly with WooCommerce for online stores. If you're using WooCommerce, Team556 tokens will appear as a payment option at checkout. If not, you can add payment buttons to any page or post using our shortcode.

### Shortcode Usage

Add a payment button to any page or post using this shortcode:

`[team556_solana_pay amount="10" description="My Product" button_text="Pay Now" success_url="https://example.com/success" cancel_url="https://example.com/cancel"]`

### Shortcode Attributes

* `amount` - The amount to charge (in USD, will be converted to Team556 tokens)
* `description` - Description of what the payment is for
* `button_text` - Text to display on the payment button
* `success_url` - URL to redirect to on successful payment
* `cancel_url` - URL to redirect to if payment is cancelled

### Compatible with Team556 Merchant App

This plugin is designed to work alongside the Team556 merchant application built with Tauri/Vue/Tailwind. It provides the WordPress/WooCommerce side of the payment processing, while maintaining compatibility with the merchant application's UI and functionality.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/team556-solana-pay` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Use the Team556 Pay → Settings screen to configure the plugin
4. Enter your Solana wallet address and Team556 token mint address
5. If using WooCommerce, go to WooCommerce → Settings → Payments to enable and configure the payment gateway

== Frequently Asked Questions ==

= What is required to use this plugin? =

You need a Solana wallet address where you will receive payments and the Team556 token mint address. Your customers will need a Solana wallet (like Phantom) with Team556 tokens to make payments.

= Does this work with WooCommerce? =

Yes! Team556 Solana Pay integrates with WooCommerce as a payment gateway. Once activated and configured, it will appear as a payment option at checkout.

= Can I use this without WooCommerce? =

Absolutely! You can add payment buttons to any page or post using our shortcode.

= Is a Solana wallet required? =

Yes, both you (the merchant) and your customers need a Solana wallet. You need one to receive payments, and your customers need one to send payments.

= Which Solana networks are supported? =

Team556 Solana Pay supports Mainnet (for real transactions), Devnet, and Testnet (for testing).

= How do I customize the payment button? =

You can customize the button text, color, and success/error messages in the plugin settings.

== Screenshots ==

1. Dashboard overview with transaction statistics
2. Transaction management page
3. Settings page
4. WooCommerce integration
5. Payment button on a page (shortcode example)
6. Payment flow with wallet connection

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release of Team556 Solana Pay. 