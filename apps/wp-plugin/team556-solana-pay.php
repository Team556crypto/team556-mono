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
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/class-team556-solana-pay-shortcode.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-admin.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-dashboard.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-settings.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/admin/class-team556-solana-pay-welcome.php';
require_once TEAM556_SOLANA_PAY_PLUGIN_DIR . 'includes/class-team556-solana-pay-verifier.php';

// Initialize the plugin
function team556_solana_pay_init() {
    // Start the plugin
    $plugin = new Team556_Solana_Pay();
    $plugin->init();
    
    // Initialize admin dashboard if in admin area
    if (is_admin()) {
        $admin = new Team556_Solana_Pay_Admin();
        $dashboard = new Team556_Solana_Pay_Dashboard();
        $settings = new Team556_Solana_Pay_Settings();
        
        // Initialize welcome screen
        $welcome = new Team556_Solana_Pay_Welcome();
    }

    // Initialize Shortcode Handler
    $shortcode_handler = new Team556_Solana_Pay_Shortcode();

    // Add other initializations like public scripts/styles if needed
    add_action('wp_enqueue_scripts', 'team556_enqueue_public_scripts');

    // Add AJAX Handlers for payment request
    add_action('wp_ajax_team556_create_payment', 'team556_handle_create_payment_request');
    add_action('wp_ajax_nopriv_team556_create_payment', 'team556_handle_create_payment_request');
}
add_action('plugins_loaded', 'team556_solana_pay_init');

/**
 * Enqueue public-facing scripts and styles.
 */
function team556_enqueue_public_scripts() {
    // Enqueue JS file for handling payment button click and AJAX
    wp_enqueue_script('team556-public-js', TEAM556_SOLANA_PAY_URL . 'assets/js/team556-public.js', array('jquery'), TEAM556_SOLANA_PAY_VERSION, true);
    // Pass ajax url and nonce to script
    wp_localize_script('team556-public-js', 'team556_ajax_obj', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        // 'nonce'    => wp_create_nonce('team556_payment_nonce') // Example nonce - uncomment if using nonce verification
    ));

     // TODO: Enqueue public CSS if needed
    // wp_enqueue_style('team556-public-css', TEAM556_SOLANA_PAY_URL . 'assets/css/team556-public.css', array(), TEAM556_SOLANA_PAY_VERSION);
}

/**
 * Handle the AJAX request to create a payment request.
 */
function team556_handle_create_payment_request() {
    // Optional: Verify nonce if implemented on the frontend
    // check_ajax_referer('team556_payment_nonce', 'nonce');

    // Sanitize input data
    $amount = isset($_POST['amount']) ? sanitize_text_field($_POST['amount']) : null;
    $description = isset($_POST['description']) ? sanitize_text_field($_POST['description']) : '';
    $order_id = isset($_POST['order_id']) ? absint($_POST['order_id']) : null;

    // Validate required data
    if (is_null($amount) || !is_numeric($amount) || $amount <= 0) {
        wp_send_json_error(array('message' => __('Invalid amount provided.', 'team556-solana-pay')), 400);
        return;
    }

    // Get plugin settings
    $settings = get_option('team556_solana_pay_settings', array()); // Default to empty array
    $merchant_wallet = $settings['merchant_wallet_address'] ?? '';
    $network = $settings['solana_network'] ?? 'mainnet'; // Default to mainnet
    $debug_mode = isset($settings['debug_mode']) && $settings['debug_mode'] === 'on';

    if (empty($merchant_wallet)) {
        wp_send_json_error(array('message' => __('Merchant wallet address is not configured in plugin settings.', 'team556-solana-pay')), 500);
        return;
    }

    // --- Call Main API Endpoint --- 
    // Prepare data payload for main-api
    $reference = uniqid('team556wp_'); // Generate a unique reference ID for tracking
    $payload = array(
        'merchant_wallet' => $merchant_wallet,
        'amount' => floatval($amount), // Ensure amount is float
        'network' => $network,
        'reference' => $reference, 
        'description' => $description,
        'order_id' => $order_id // Pass order ID if available
    );

    // Define the main API endpoint URL - REPLACE WITH ACTUAL URL
    // Consider storing this in wp-config.php or as a constant defined elsewhere for security/flexibility
    $main_api_url = defined('TEAM556_MAIN_API_PAYMENT_URL') ? TEAM556_MAIN_API_PAYMENT_URL : 'YOUR_MAIN_API_ENDPOINT_URL'; 
    
    if ($main_api_url === 'YOUR_MAIN_API_ENDPOINT_URL') {
         if ($debug_mode) {
            error_log('[Team556 Solana Pay] Debug: Main API URL is not defined. Using placeholder logic.');
            // Fallback to placeholder for debugging if URL not set
            wp_send_json_success(array(
                'message' => 'Payment request initiated (Debug - Placeholder URL).',
                'reference' => $reference,
                'solana_pay_url' => 'solana:https://placeholder.solanapay.com/api/pay?reference=' . $reference . '&amount=' . $amount
            ));
         } else {
            error_log('[Team556 Solana Pay] Error: Main API payment endpoint URL is not configured.');
            wp_send_json_error(array('message' => __('Payment processing service is not configured.', 'team556-solana-pay')), 503); // Service Unavailable
         }
         return;
    }

    $response = wp_remote_post($main_api_url, array(
        'method'    => 'POST',
        'timeout'   => 20, // Increased timeout for potential network latency
        'headers'   => array(
            'Content-Type' => 'application/json; charset=utf-8',
            // Add any necessary authentication headers here (e.g., API Key)
            // 'Authorization' => 'Bearer YOUR_API_KEY'
        ),
        'body'      => json_encode($payload),
        'data_format' => 'body',
    ));
    
    if (is_wp_error($response)) {
        $error_message = $response->get_error_message();
        error_log('[Team556 Solana Pay] Error calling main API: ' . $error_message);
        wp_send_json_error(array(
            'message' => __('Failed to communicate with the payment service.', 'team556-solana-pay'), 
            'details' => $debug_mode ? $error_message : null // Only show details in debug mode
        ), 503); // Service Unavailable
        return;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    $http_code = wp_remote_retrieve_response_code($response);
    
    if ($http_code >= 400 || !$data || !isset($data['solana_pay_url'])) {
        $error_detail = $debug_mode && $data ? json_encode($data) : ($http_code >= 400 ? "Service responded with status {$http_code}" : 'Invalid response format from service.');
        error_log("[Team556 Solana Pay] Error response from main API (HTTP {$http_code}): " . $body);
        wp_send_json_error(array(
            'message' => __('Failed to create the payment request.', 'team556-solana-pay'), 
            'details' => $error_detail
        ), $http_code > 0 ? $http_code : 500);
        return;
    }

    // Success - return the Solana Pay URL and reference from the main API response
    wp_send_json_success(array(
        'message' => __('Payment request created successfully.', 'team556-solana-pay'), 
        'reference' => $reference, // Also return the reference used
        'solana_pay_url' => sanitize_url($data['solana_pay_url']) // Sanitize the URL before output
    ));
}

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