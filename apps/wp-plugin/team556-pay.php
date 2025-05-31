<?php
/**
 * Plugin Name: Team556 Pay
 * Plugin URI: https://team556.com
 * Description: WordPress plugin to accept Team556 tokens using Solana Pay
 * Version: 1.0.0
 * Author: Team556
 * Text Domain: team556-pay
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('TEAM556_PAY_VERSION', '1.0.0');
define('TEAM556_PAY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TEAM556_PAY_PLUGIN_URL', plugin_dir_url(__FILE__));
// Token mint address is now hardcoded in relevant files for security
define('TEAM556_PAY_TEAM556_TOKEN_MINT', 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5');

// Include required files
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-db.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/admin/class-team556-pay-admin.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/admin/class-team556-pay-dashboard.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/admin/class-team556-pay-settings.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/admin/class-team556-pay-welcome.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-verifier.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-shortcode.php';
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-gateway-blocks.php';

// Temporary debugging function
if (!function_exists('team556_debug_payment_gateways')) {
    function team556_debug_payment_gateways($gateways) {
        error_log('Available gateways: ' . print_r(array_map(function($gw) { return is_object($gw) ? get_class($gw) : $gw; }, $gateways), true));
        foreach ($gateways as $gateway) {
            if (is_string($gateway) && $gateway === 'Team556_Pay_Gateway') {
                error_log('Team556_Pay_Gateway string found in gateways list.');
            } elseif (is_object($gateway) && get_class($gateway) === 'Team556_Pay_Gateway') {
                error_log('Team556_Pay_Gateway object found. Enabled: ' . $gateway->enabled . ', Wallet: ' . $gateway->wallet_address);
            }
        }
        return $gateways;
    }
    add_filter('woocommerce_payment_gateways', 'team556_debug_payment_gateways', 20);
}

// Initialize the plugin
function team556_pay_init() {
    // Start the plugin
    $plugin = new Team556_Pay();
    $plugin->init();
    
    // Initialize admin dashboard if in admin area
    if (is_admin()) {
        $admin = new Team556_Pay_Admin();
        $dashboard = new Team556_Pay_Dashboard();
        $settings = new Team556_Pay_Settings();
        
        // Initialize welcome screen
        $welcome = new Team556_Pay_Welcome();
    }

    // Initialize Shortcode Handler
    $shortcode_handler = new Team556_Pay_Shortcode();

    // Add other initializations like public scripts/styles if needed
    add_action('wp_enqueue_scripts', 'team556_enqueue_public_scripts');

    // Add AJAX Handlers for payment request
    add_action('wp_ajax_team556_create_payment', 'team556_handle_create_payment_request');
    add_action('wp_ajax_nopriv_team556_create_payment', 'team556_handle_create_payment_request');

    // AJAX handler for block-based checkout QR code data
    add_action('wp_ajax_team556_get_block_payment_data', 'team556_handle_get_block_payment_data_request');
    add_action('wp_ajax_nopriv_team556_get_block_payment_data', 'team556_handle_get_block_payment_data_request');
}
add_action('plugins_loaded', 'team556_pay_init');

/**
 * Handle AJAX request to get payment data for block-based checkout QR code.
 */
function team556_handle_get_block_payment_data_request() {
    // Basic security check - consider adding a nonce if sensitive operations were involved.
    // check_ajax_referer('team556_pay_block_nonce', 'security');

    if (!class_exists('WooCommerce') || !WC()->cart) {
        wp_send_json_error(['message' => __('WooCommerce or Cart not available.', 'team556-pay')]);
        return;
    }

    $cart_total = WC()->cart->get_total('edit'); // Get cart total without formatting
    $currency = get_woocommerce_currency();

    // TODO: Potentially convert $cart_total to the smallest unit of the token if necessary.

    // Get recipient wallet and token mint from settings
    // These are examples; adjust to how your settings are stored.
    $gateway_settings = get_option('woocommerce_team556_pay_settings', array());
    $recipient_wallet = !empty($gateway_settings['wallet_address']) ? $gateway_settings['wallet_address'] : '';
    $token_mint = defined('TEAM556_PAY_TEAM556_TOKEN_MINT') ? TEAM556_PAY_TEAM556_TOKEN_MINT : ''; // Using the defined constant
 
    if (empty($recipient_wallet)) {
        error_log('Team556 Pay: Recipient wallet address is not configured in settings.');
        wp_send_json_error(['message' => __('Payment gateway not configured correctly (missing wallet address).', 'team556-pay')]);
        return;
    }
    if (empty($token_mint)) {
        error_log('Team556 Pay: Token mint address is not configured.');
        wp_send_json_error(['message' => __('Payment gateway not configured correctly (missing token mint).', 'team556-pay')]);
        return;
    }

    // Generate a unique reference for the payment. Could be based on session, cart hash, or a pre-generated order ID if available.
    // For simplicity, let's use a timestamp and a random component for now.
    // In a real scenario, you'd want something more robust, possibly linked to a pre-saved order or payment intent.
    $reference = 'block_' . time() . '_' . wp_generate_password(8, false);

    // Construct the Solana Pay URL
    // Ensure amount is formatted correctly (e.g., no thousands separators, correct decimal places for the token)
    $payment_url_params = [
        'amount' => $cart_total,
        'spl-token' => $token_mint,
        'reference' => $reference,
        'label' => sanitize_text_field(get_bloginfo('name')),
        'message' => sprintf(__('Order from %s', 'team556-pay'), sanitize_text_field(get_bloginfo('name'))),
    ];
    $payment_url = 'solana:' . $recipient_wallet . '?' . http_build_query($payment_url_params);

    wp_send_json_success([
        'paymentUrl' => $payment_url,
        'reference' => $reference, // Send back the reference if needed for polling
    ]);
}


/**
 * Enqueue public-facing scripts and styles.
 */
function team556_enqueue_public_scripts() {
    // Enqueue qrcode.js for generating QR codes
    wp_enqueue_script('team556-qrcode', TEAM556_PAY_PLUGIN_URL . 'assets/js/qrcode.min.js', array(), TEAM556_PAY_VERSION, true);

    // Enqueue public CSS styles
    wp_enqueue_style('team556-pay-public-style', TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-public.css', array(), TEAM556_PAY_VERSION);

    // Enqueue JS file for handling payment button click and AJAX
    wp_enqueue_script('team556-public-js', TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-public.js', array('jquery'), TEAM556_PAY_VERSION, true);
    // Pass ajax url and nonce to script
    wp_localize_script('team556-public-js', 'team556_ajax_obj', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        // 'nonce'    => wp_create_nonce('team556_payment_nonce') // Example nonce - uncomment if using nonce verification
    ));

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
        wp_send_json_error(array('message' => __('Invalid amount provided.', 'team556-pay')), 400);
        return;
    }

    // Get plugin settings
    $settings = get_option('team556_pay_settings', array()); // Default to empty array
    $merchant_wallet = $settings['merchant_wallet_address'] ?? '';
    $network = $settings['solana_network'] ?? 'mainnet'; // Default to mainnet
    $debug_mode = isset($settings['debug_mode']) && $settings['debug_mode'] === 'on';

    if (empty($merchant_wallet)) {
        wp_send_json_error(array('message' => __('Merchant wallet address is not configured in plugin settings.', 'team556-pay')), 500);
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
            error_log('[Team556 Pay] Debug: Main API URL is not defined. Using placeholder logic.');
            // Fallback to placeholder for debugging if URL not set
            wp_send_json_success(array(
                'message' => 'Payment request initiated (Debug - Placeholder URL).',
                'reference' => $reference,
                'solana_pay_url' => 'solana:https://placeholder.solanapay.com/api/pay?reference=' . $reference . '&amount=' . $amount
            ));
         } else {
            error_log('[Team556 Pay] Error: Main API payment endpoint URL is not configured.');
            wp_send_json_error(array('message' => __('Payment processing service is not configured.', 'team556-pay')), 503); // Service Unavailable
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
        error_log('[Team556 Pay] Error calling main API: ' . $error_message);
        wp_send_json_error(array(
            'message' => __('Failed to communicate with the payment service.', 'team556-pay'), 
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
            'message' => __('Failed to create the payment request.', 'team556-pay'), 
            'details' => $error_detail
        ), $http_code > 0 ? $http_code : 500);
        return;
    }

    // Success - return the Solana Pay URL and reference from the main API response
    wp_send_json_success(array(
        'message' => __('Payment request created successfully.', 'team556-pay'), 
        'reference' => $reference, // Also return the reference used
        'solana_pay_url' => sanitize_url($data['solana_pay_url']) // Sanitize the URL before output
    ));
}

/**
 * Registers the Team556 Pay block-based payment method type.
 *
 * @param Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry The payment method registry.
 */
function team556_pay_register_block_support( $payment_method_registry ) {
    error_log('[Team556 Pay] Attempting to register block support...');
    if ( ! class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
        error_log('[Team556 Pay] AbstractPaymentMethodType class NOT FOUND.');
        return;
    }

    // Register the payment method type.
    // The class Team556_Pay_Gateway_Blocks_Integration is loaded via the include above.
    error_log('[Team556 Pay] AbstractPaymentMethodType class FOUND.');
    if ( ! class_exists( 'Team556_Pay_Gateway_Blocks_Integration' ) ) {
        error_log('[Team556 Pay] Team556_Pay_Gateway_Blocks_Integration class NOT FOUND before registration.');
        return;
    }
    error_log('[Team556 Pay] Team556_Pay_Gateway_Blocks_Integration class FOUND. Attempting to register.');
    try {
        $payment_method_registry->register( new Team556_Pay_Gateway_Blocks_Integration() );
        error_log('[Team556 Pay] Successfully called payment_method_registry->register().');
    } catch (Exception $e) {
        error_log('[Team556 Pay] ERROR during registration: ' . $e->getMessage());
    }
}
add_action( 'woocommerce_blocks_payment_method_type_registration', 'team556_pay_register_block_support' );


// Register activation and deactivation hooks
register_activation_hook(__FILE__, 'team556_pay_activate');
register_deactivation_hook(__FILE__, 'team556_pay_deactivate');

/**
 * Plugin activation function
 */
function team556_pay_activate() {
    // Create database tables
    $db = new Team556_Pay_DB();
    $db->create_tables();
    
    // Set default options
    if (!get_option('team556_pay_version')) {
        // Button text default
        update_option('team556_pay_button_text', __('Pay with Team556 Token', 'team556-pay'));
        
        // Button color default
        update_option('team556_pay_button_color', '#9945FF');
        
        // Network default
        update_option('team556_pay_network', 'mainnet');
        
        // Default success message
        update_option('team556_pay_success_message', __('Payment successful! Thank you for your purchase.', 'team556-pay'));
        
        // Default error message
        update_option('team556_pay_error_message', __('Payment failed. Please try again or contact support.', 'team556-pay'));
        
        // Debug mode (off by default)
        update_option('team556_pay_debug_mode', '0');
        
        // Confirmation blocks
        update_option('team556_pay_confirmation_blocks', '1');
        
        // Set default token mint (Team556)
        update_option('team556_pay_token_mint', 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg');
    }
    
    // Store version number
    update_option('team556_pay_version', TEAM556_PAY_VERSION);
    
    // Auto-enable the WooCommerce payment gateway if WooCommerce is active
    if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
        // Get existing WooCommerce payment gateway settings
        $gateways = get_option('woocommerce_gateway_order', array());
        
        // Make sure our gateway is in the list
        if (!in_array('team556_pay', $gateways)) {
            $gateways[] = 'team556_pay';
            update_option('woocommerce_gateway_order', $gateways);
        }
        
        // Enable our gateway
        $gateway_options = get_option('woocommerce_team556_pay_settings', array());
        $gateway_options['enabled'] = 'yes';
        
        // Set default title and description if not already set
        if (!isset($gateway_options['title'])) {
            $gateway_options['title'] = __('Team556 Token (Pay)', 'team556-pay');
        }
        if (!isset($gateway_options['description'])) {
            $gateway_options['description'] = __('Pay with Team556 tokens via Team556 Pay. You will need a Solana wallet with Team556 tokens.', 'team556-pay');
        }
        
        // Save gateway settings
        update_option('woocommerce_team556_pay_settings', $gateway_options);
    }
    
    // Set transient for welcome screen
    set_transient('team556_pay_activation_redirect', true, 30);
    
    // Clear permalinks
    flush_rewrite_rules();
}

/**
 * Plugin deactivation function
 */
function team556_pay_deactivate() {
    // Clear any scheduled events
    wp_clear_scheduled_hook('team556_pay_check_pending_transactions');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}

/**
 * Plugin uninstall hook - must be registered in a separate uninstall.php file
 * This is just for reference
 */
function team556_pay_uninstall() {
    // Get global wpdb object
    global $wpdb;
    
    // Delete plugin tables
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}team556_transactions");
    
    // Delete plugin options
    delete_option('team556_pay_version');
    delete_option('team556_pay_wallet_address');
    delete_option('team556_pay_token_mint');
    delete_option('team556_pay_network');
    delete_option('team556_pay_button_text');
    delete_option('team556_pay_button_color');
    delete_option('team556_pay_success_message');
    delete_option('team556_pay_error_message');
    delete_option('team556_pay_debug_mode');
    delete_option('team556_pay_confirmation_blocks');
} 