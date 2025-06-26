<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Plugin Name: Team556 Pay
 * Plugin URI: https://team556.com
 * Description: WordPress plugin to accept Team556 tokens using Solana Pay
 * Version: 1.0.0
 * Author: Team556
 * Text Domain: team556-pay
 */

// Define plugin constants
define('TEAM556_PAY_VERSION', '1.0.0');
define('TEAM556_PAY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TEAM556_PAY_PLUGIN_URL', plugin_dir_url(__FILE__));
// Token mint address is now hardcoded in relevant files for security
define('TEAM556_PAY_TEAM556_TOKEN_MINT', 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5');
// Define the main API URL - this should point to the main-api (Go Fiber server) 
// which acts as a proxy for the solana-api service
if (!defined('TEAM556_MAIN_API_URL')) {
    define('TEAM556_MAIN_API_URL', 'https://team556-main-api.fly.dev/api/');
}

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
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-gateway.php'; // Ensure gateway class is loaded once.
require_once TEAM556_PAY_PLUGIN_DIR . 'includes/constants/color-constants.php';



// Temporary debugging function
if (!function_exists('team556_debug_payment_gateways')) {
    function team556_debug_payment_gateways($gateways) {

        foreach ($gateways as $gateway) {
            if (is_string($gateway) && $gateway === 'Team556_Pay_Gateway') {

            } elseif (is_object($gateway) && get_class($gateway) === 'Team556_Pay_Gateway') {

            }
        }
        return $gateways;
    }
    add_filter('woocommerce_payment_gateways', 'team556_debug_payment_gateways', 20);
}

/**
 * Synchronize relevant global Team556 settings to the Team556 Pay WooCommerce gateway settings.
 *
 * This ensures that when the main Team556 settings are updated, the specific
 * WooCommerce payment gateway settings for Team556 Pay are also updated to match,
 * maintaining consistency across the plugin.
 *
 * @param mixed $old_value The old option value for 'team556_pay_settings'.
 * @param mixed $new_value The new option value for 'team556_pay_settings' (array).
 * @param string $option_name The name of the option being updated (should be 'team556_pay_settings').
 */
function team556_sync_global_settings_to_gateway($old_value, $new_value, $option_name) {
    // Ensure we are only acting on our specific global settings option.
    if ('team556_pay_settings' !== $option_name) {
        return;
    }

    // The option name for WooCommerce gateway settings is 'woocommerce_{gateway_id}_settings'.
    $gateway_settings_option_name = 'woocommerce_team556_pay_settings';
    $gateway_settings = get_option($gateway_settings_option_name, array());

    $settings_changed = false;

    // 1. Synchronize Merchant Wallet Address
    // Global key: 'merchant_wallet_address', Gateway key: 'wallet_address'
    if (isset($new_value['merchant_wallet_address'])) {
        $new_wallet_address = sanitize_text_field($new_value['merchant_wallet_address']);
        if (!isset($gateway_settings['wallet_address']) || $gateway_settings['wallet_address'] !== $new_wallet_address) {
            $gateway_settings['wallet_address'] = $new_wallet_address;
            $settings_changed = true;
        }
    }

    // 2. Synchronize Debug Mode
    // Global key: 'debug_mode' (1 for true/checked, 0 or not set for false/unchecked)
    // Gateway key: 'debug_mode' ('yes' or 'no')
    $new_global_debug_mode = isset($new_value['debug_mode']) && $new_value['debug_mode'] == 1;
    $new_gateway_debug_mode_value = $new_global_debug_mode ? 'yes' : 'no';
    
    if (!isset($gateway_settings['debug_mode']) || $gateway_settings['debug_mode'] !== $new_gateway_debug_mode_value) {
        $gateway_settings['debug_mode'] = $new_gateway_debug_mode_value;
        $settings_changed = true;
    }

    // Solana Network is now hardcoded to 'mainnet' in the gateway, no sync needed.

    // 4. Synchronize Gateway Title
    // Global key: 'gateway_title', Gateway key: 'title'
    if (isset($new_value['gateway_title'])) {
        $new_gateway_title = sanitize_text_field($new_value['gateway_title']);
        if (!isset($gateway_settings['title']) || $gateway_settings['title'] !== $new_gateway_title) {
            $gateway_settings['title'] = $new_gateway_title;
            $settings_changed = true;
        }
    }

    // 5. Synchronize Gateway Description
    // Global key: 'gateway_description', Gateway key: 'description'
    if (isset($new_value['gateway_description'])) {
        $new_gateway_description = sanitize_textarea_field($new_value['gateway_description']);
        if (!isset($gateway_settings['description']) || $gateway_settings['description'] !== $new_gateway_description) {
            $gateway_settings['description'] = $new_gateway_description;
            $settings_changed = true;
        }
    }

    // If any settings were changed in the gateway's array, update the option.
    if ($settings_changed) {
        update_option($gateway_settings_option_name, $gateway_settings);
    }
}
add_action('update_option_team556_pay_settings', 'team556_sync_global_settings_to_gateway', 10, 3);



// Initialize the plugin
function team556_pay_init() {
    // Add the gateway to WooCommerce
    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'Team556_Pay_Gateway';
        return $gateways;
    });
    // Load plugin textdomain for translations
    load_plugin_textdomain('team556-pay', false, dirname(plugin_basename(__FILE__)) . '/languages/');

    // Start the plugin
    // Get the singleton instance. This will run the constructor once
    // and register the rest_api_init action.
    $plugin = Team556_Pay::get_instance();
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

    // AJAX handler for block-based checkout QR code data (preferred action)
    add_action('wp_ajax_team556_get_block_payment_data', 'team556_handle_get_block_payment_data_request');
    add_action('wp_ajax_nopriv_team556_get_block_payment_data', 'team556_handle_get_block_payment_data_request');
    
    // Back-compat: older JS may still call the handler name directly as the action.
    add_action('wp_ajax_team556_handle_get_block_payment_data_request', 'team556_handle_get_block_payment_data_request');
    add_action('wp_ajax_nopriv_team556_handle_get_block_payment_data_request', 'team556_handle_get_block_payment_data_request');
}
add_action('plugins_loaded', 'team556_pay_init');

/**
 * Returns the main instance of Team556_Pay.
 *
 * @return Team556_Pay
 */
function team556_pay() {
    return Team556_Pay::get_instance();
}

// Initialize the plugin instance.
team556_pay();

/**
 * Handle AJAX request to get payment data for block-based checkout QR code.
 */
function team556_handle_get_block_payment_data_request() {
    $log_source = 'team556_pay_debug'; // Consolidated log source

    // Log 1: Handler called
    if (function_exists('wc_get_logger')) {
        $logger = wc_get_logger();

    }

    // Check for Gateway Class File
    $class_file = plugin_dir_path(__FILE__) . 'includes/class-team556-pay-gateway.php';
    if (!file_exists($class_file)) {
        if (function_exists('wc_get_logger')) {
            $logger = wc_get_logger();

        }
        wp_send_json_error(['message' => 'Payment gateway error (file missing).', 'tokenPrice' => null, 'requiredTokenAmount' => null]);
        wp_die();
    }
    require_once $class_file;

    // Check if Class is Defined
    if (!class_exists('Team556_Pay_Gateway')) {
        if (function_exists('wc_get_logger')) {
            $logger = wc_get_logger();

        }
        wp_send_json_error(['message' => 'Payment gateway error (class not defined).', 'tokenPrice' => null, 'requiredTokenAmount' => null]);
        wp_die();
    }

    // Check if WooCommerce is active and WC()->cart is available
    if (!class_exists('WooCommerce') || !WC()->cart) {
        if (function_exists('wc_get_logger')) {
            $logger = wc_get_logger();

        }
        wp_send_json_error(['message' => 'WooCommerce cart not available.', 'tokenPrice' => null, 'requiredTokenAmount' => null]);
        wp_die();
    }

    $gateway = new Team556_Pay_Gateway();

    // Log 2: Gateway Instantiation Check
    if (!is_object($gateway)) {
        if (function_exists('wc_get_logger')) {
            $logger = wc_get_logger();

        }
        wp_send_json_error(['message' => 'Payment gateway error (instantiation failed).', 'tokenPrice' => null, 'requiredTokenAmount' => null]);
        wp_die(); 
    }

    // Fetch price data
    // Note: $gateway->fetch_team556_price_data() uses its own $this->debug_mode. 
    // The $current_debug_setting is for logging within *this* AJAX handler scope.
    $price_data = $gateway->fetch_team556_price_data();

    $token_price = null;
    $currency = get_woocommerce_currency();
    $cart_total = WC()->cart->get_total('edit'); 
    $required_token_amount = null;
    $error_message = null;

    // Check maximum order total limit before processing payment
    $team556_pay_options = get_option('team556_pay_settings');
    $enable_max_total_limit = isset($team556_pay_options['enable_max_order_total']) && $team556_pay_options['enable_max_order_total'] == 1;
    $max_total_setting = isset($team556_pay_options['max_order_total']) ? $team556_pay_options['max_order_total'] : '';

    if ($enable_max_total_limit && $max_total_setting !== '' && is_numeric($max_total_setting) && (float)$max_total_setting > 0) {
        $max_total_value = (float) $max_total_setting;
        if ($cart_total > $max_total_value) {
            $formatted_cart_total = number_format($cart_total, 2);
            $formatted_max_total = number_format($max_total_value, 2);
            $error_message = sprintf(
                __('Your order total %s exceeds the maximum allowed for Team556 Pay (%s). Please choose a different payment method or reduce your order total.', 'team556-pay'),
                $formatted_cart_total . ' ' . $currency,
                $formatted_max_total . ' ' . $currency
            );
            // Return error to prevent payment URL generation
            wp_send_json_error([
                'message' => $error_message,
                'tokenPrice' => null, 
                'requiredTokenAmount' => null,
                'cartTotalFiat' => $cart_total,
                'currency' => $currency
            ]);
            wp_die();
        }
    }

    if (isset($price_data['error'])) {
        $error_message = $price_data['error'];
    } elseif (isset($price_data['price'])) {
        $token_price_str = $price_data['price']; // Keep as string
        $token_price = (float) $token_price_str; // Set numeric token price for response

        // Ensure cart_total is a string for bcmath operations
        $cart_total_str = (string) $cart_total;

        // Use bccomp for comparing string numbers, 9 is the scale (decimal places)
        if (is_numeric($token_price_str) && bccomp($token_price_str, '0', 9) > 0) {
            // Calculate required token amount with 9 decimal places precision
            $required_token_amount = bcdiv($cart_total_str, $token_price_str, 9);
        } else {
            $error_message = 'Token price is zero or invalid.';
        }
    } else {
        $error_message = 'Could not retrieve current token price (unknown reason).';
    }

    // Construct Solana Pay URL
    $recipient_wallet = $gateway->get_option('wallet_address');
    $token_mint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5'; // Always use Team556 token mint

    // Parameters for the query string part of the Solana Pay URL
    $query_params = [
        'spl-token' => $token_mint,
        'amount'    => $required_token_amount, // This will be a string with 9 decimal places
        'label'     => get_bloginfo('name'),
        'message'   => sprintf(__('Payment for Order at %s', 'team556-pay'), get_bloginfo('name')),
    ];

    // Filter out any null or empty parameters from the query
    $query_params = array_filter($query_params, function($value) {
        return $value !== null && $value !== '';
    });

    // Build the query string
    $query_string = http_build_query($query_params, '', '&', PHP_QUERY_RFC3986);

    // Construct the final Solana Pay URL
    // Format: solana:<recipient_address>?<query_parameters>
    $payment_url = 'solana:' . $recipient_wallet;
    if (!empty($query_string)) {
        $payment_url .= '?' . $query_string;
    }

    wp_send_json_success([
        'paymentUrl' => $payment_url,
        'tokenPrice' => $token_price,
        'currency' => $currency,
        'cartTotalFiat' => (float) $cart_total,
        'requiredTokenAmount' => $required_token_amount,
        'errorMessage' => $error_message,
    ]);
    wp_die();
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

            // Fallback to placeholder for debugging if URL not set
            wp_send_json_success(array(
                'message' => 'Payment request initiated (Debug - Placeholder URL).',
                'reference' => $reference,
                'solana_pay_url' => 'solana:https://placeholder.solanapay.com/api/pay?reference=' . $reference . '&amount=' . $amount
            ));
         } else {

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

    if ( ! class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {

        return;
    }

    // Register the payment method type.
    // The class Team556_Pay_Gateway_Blocks_Integration is loaded via the include above.

    if ( ! class_exists( 'Team556_Pay_Gateway_Blocks_Integration' ) ) {

        return;
    }

    try {
        $payment_method_registry->register( new Team556_Pay_Gateway_Blocks_Integration() );

    } catch (Exception $e) {

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