<?php
/**
 * Plugin Name: Team556 Solana Pay
 * Plugin URI: https://team556.com
 * Description: WordPress plugin to accept Team556 tokens using Solana Pay
 * Version: 1.0.0
 * Author: Team556
 * Text Domain: team556-solana-pay
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('TEAM556_SOLANA_PAY_VERSION', '1.0.0');
define('TEAM556_SOLANA_PAY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TEAM556_SOLANA_PAY_PLUGIN_URL', plugin_dir_url(__FILE__));
// Token mint address is now hardcoded in relevant files for security

// Include required files
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/class-team556-solana-pay-db.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/class-team556-solana-pay.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-admin.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-dashboard.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-settings.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/class-team556-solana-pay-verifier.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-welcome.php';

// Initialize the plugin
function team556_solana_pay_init() {
    // Start the plugin
    $plugin = new Team556_Solana_Pay();
    $plugin->init();
    
    // Initialize admin dashboard
    if (is_admin()) {
        $admin = new Team556_Solana_Pay_Admin();
        $dashboard = new Team556_Solana_Pay_Dashboard();
        $settings = new Team556_Solana_Pay_Settings();
        
        // Initialize welcome screen
        $welcome = new Team556_Solana_Pay_Welcome();
    }
}
add_action('plugins_loaded', 'team556_solana_pay_init');

// Register activation and deactivation hooks
register_activation_hook(__FILE__, 'team556_solana_pay_activate');
register_deactivation_hook(__FILE__, 'team556_solana_pay_deactivate');

/**
 * Plugin activation function
 */
function team556_solana_pay_activate() {
    // Create database tables
    $db = new Team556_Solana_Pay_DB();
    $db->create_tables();
    
    // Set default options
    if (!get_option('team556_solana_pay_version')) {
        // Button text default
        update_option('team556_solana_pay_button_text', __('Pay with Team556 Token', 'team556-solana-pay'));
        
        // Button color default
        update_option('team556_solana_pay_button_color', '#9945FF');
        
        // Network default
        update_option('team556_solana_pay_network', 'mainnet');
        
        // Default success message
        update_option('team556_solana_pay_success_message', __('Payment successful! Thank you for your purchase.', 'team556-solana-pay'));
        
        // Default error message
        update_option('team556_solana_pay_error_message', __('Payment failed. Please try again or contact support.', 'team556-solana-pay'));
        
        // Debug mode (off by default)
        update_option('team556_solana_pay_debug_mode', '0');
        
        // Confirmation blocks
        update_option('team556_solana_pay_confirmation_blocks', '1');
        
        // Set default token mint (Team556)
        update_option('team556_solana_pay_token_mint', 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg');
    }
    
    // Store version number
    update_option('team556_solana_pay_version', TEAM556_SOLANA_PAY_VERSION);
    
    // Auto-enable the WooCommerce payment gateway if WooCommerce is active
    if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
        // Get existing WooCommerce payment gateway settings
        $gateways = get_option('woocommerce_gateway_order', array());
        
        // Make sure our gateway is in the list
        if (!in_array('team556_solana_pay', $gateways)) {
            $gateways[] = 'team556_solana_pay';
            update_option('woocommerce_gateway_order', $gateways);
        }
        
        // Enable our gateway
        $gateway_options = get_option('woocommerce_team556_solana_pay_settings', array());
        $gateway_options['enabled'] = 'yes';
        
        // Set default title and description if not already set
        if (!isset($gateway_options['title'])) {
            $gateway_options['title'] = __('Team556 Token (Solana Pay)', 'team556-solana-pay');
        }
        if (!isset($gateway_options['description'])) {
            $gateway_options['description'] = __('Pay with Team556 tokens via Solana Pay. You will need a Solana wallet with Team556 tokens.', 'team556-solana-pay');
        }
        
        // Save gateway settings
        update_option('woocommerce_team556_solana_pay_settings', $gateway_options);
    }
    
    // Set transient for welcome screen
    set_transient('team556_solana_pay_activation_redirect', true, 30);
    
    // Clear permalinks
    flush_rewrite_rules();
}

/**
 * Plugin deactivation function
 */
function team556_solana_pay_deactivate() {
    // Clear any scheduled events
    wp_clear_scheduled_hook('team556_solana_pay_check_pending_transactions');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}

/**
 * Plugin uninstall hook - must be registered in a separate uninstall.php file
 * This is just for reference
 */
function team556_solana_pay_uninstall() {
    // Get global wpdb object
    global $wpdb;
    
    // Delete plugin tables
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}team556_solana_transactions");
    
    // Delete plugin options
    delete_option('team556_solana_pay_version');
    delete_option('team556_solana_pay_wallet_address');
    delete_option('team556_solana_pay_token_mint');
    delete_option('team556_solana_pay_network');
    delete_option('team556_solana_pay_button_text');
    delete_option('team556_solana_pay_button_color');
    delete_option('team556_solana_pay_success_message');
    delete_option('team556_solana_pay_error_message');
    delete_option('team556_solana_pay_debug_mode');
    delete_option('team556_solana_pay_confirmation_blocks');
} 