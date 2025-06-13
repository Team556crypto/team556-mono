<?php
/**
 * Team556 Solana Pay WooCommerce Payment Gateway
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce Solana Pay Payment Gateway
 */
class Team556_Pay_Gateway extends WC_Payment_Gateway {
    public $unavailability_reason = '';
    public $logger = null;
    /**
     * Constructor
     */
    public function __construct() {
        $this->id                 = 'team556_pay';
        $this->icon               = TEAM556_PAY_PLUGIN_URL . 'assets/images/logo-round-dark.png';
        $this->has_fields         = true;
        $this->method_title       = __('Team556 Pay', 'team556-pay');
        $this->method_description = __('Accept Team556 token payments via Team556 Pay', 'team556-pay');
        $this->supports           = array('products', 'woocommerce-blocks');

        // Load settings
        $this->init_form_fields();
        $this->init_settings();

        // Get settings
        $this->title              = $this->get_option('title');
        $this->description        = $this->get_option('description');
        $this->wallet_address     = $this->get_option('wallet_address');
        $this->debug_mode         = $this->get_option('debug_mode', 'no');
        $this->network            = 'mainnet'; // Hardcode to mainnet

        // If no wallet address is set in gateway settings, use the global plugin setting
        // This remains important for wallet_address fallback if gateway-specific wallet is empty.
        if (empty($this->wallet_address)) {
            $global_settings = get_option('team556_pay_settings'); // Fetch the array of global settings
            if (!empty($global_settings) && isset($global_settings['merchant_wallet_address'])) {
                $this->wallet_address = $global_settings['merchant_wallet_address'];
            } else {
                $this->wallet_address = ''; // Default if not found
            }
        }
        // Ensure $this->network is 'mainnet' even if global settings were to have a different value for 'network' or 'solana_network'
        // This overrides any potential sync from global settings for the network specifically.
        $this->network = 'mainnet';
        
        // Add payment method CSS to ensure visibility on all themes
        add_action('wp_head', array($this, 'add_payment_method_styles'));
        
        // Fix double checkbox issue
        add_filter('woocommerce_gateway_icon', array($this, 'fix_gateway_icon'), 10, 2);
        add_filter('woocommerce_payment_gateway_get_title', array($this, 'fix_gateway_title'), 10, 2);
        
        // Actions
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action( 'woocommerce_receipt_' . $this->id, array( $this, 'receipt_page' ) );
        add_action('woocommerce_admin_order_data_after_billing_address', array($this, 'display_transaction_data_in_admin'));
        add_action('wp_ajax_team556_pay_complete_payment', array($this, 'ajax_complete_payment'));
        add_action('wp_ajax_nopriv_team556_pay_complete_payment', array($this, 'ajax_complete_payment'));
        add_action('wp_ajax_team556_pay_check_payment', array($this, 'check_payment'));
        add_action('wp_ajax_nopriv_team556_pay_check_payment', array($this, 'check_payment'));
        
        // Admin notice for wallet address
        if (is_admin() && empty($this->wallet_address)) {
            add_action('admin_notices', array($this, 'admin_wallet_notice'));
        }
        
        // Enqueue payment scripts
        add_action( 'wp_enqueue_scripts', array( $this, 'payment_scripts' ), 90 ); // Run a bit later

        // Initialize logger if debug mode is enabled
        if ($this->debug_mode === 'yes') {
            if (class_exists('WC_Logger')) {
                $this->logger = new WC_Logger();
            } else {
                // Fallback or error if WC_Logger is not available, though it should be in a WooCommerce context.
                // For now, we'll just proceed without logging if WC_Logger isn't found.
            }
        }
    }

    /**
     * Log debug messages if debug mode is enabled.
     *
     * @param string $message The message to log.
     * @param string $context Optional context for the log entry (e.g., method name).
     */
    public function log_debug($message, $context = 'debug') {
        if ($this->debug_mode === 'yes' && is_object($this->logger)) {
            // Prepend context to the message for clarity in logs
            $log_message = '[' . strtoupper($context) . '] ' . $message;
            $this->logger->debug($log_message, array('source' => 'team556-pay'));
        }
    }

    /**
     * Log messages for debugging.
     *
     * @param string $message The message to log.
     * @param string $level   The log level (e.g., 'info', 'debug', 'error'). Defaults to 'info'.
     */
    public function log($message, $level = 'info') {
        if ($this->debug_mode === 'yes' && class_exists('WC_Logger')) {
            if (empty($this->logger)) {
                $this->logger = wc_get_logger();
            }
            // Prefix the message with the gateway ID for easier identification in logs
            $formatted_message = '[' . $this->id . '] ' . $message;
            $this->logger->log($level, $formatted_message, array('source' => $this->id));
        }
    }

    /**
     * Get the icon URL for the block-based checkout.
     *
     * @return string
     */
    public function get_icon_url_for_blocks() {
        return $this->icon;
    }

    /**
     * Display admin notice for missing wallet address
     */
    public function admin_wallet_notice() {
        ?>
        <div class="notice notice-error">
            <p>
                <strong><?php _e('Team556 Pay Gateway', 'team556-pay'); ?>:</strong> 
                <?php _e('Please set your merchant wallet address to enable Team556 Pay.', 'team556-pay'); ?>
                <a href="<?php echo admin_url('admin.php?page=wc-settings&tab=checkout&section=team556_pay'); ?>" class="button button-primary">
                    <?php _e('Set Wallet Address', 'team556-pay'); ?>
                </a>
            </p>
        </div>
        <?php
    }

    /**
     * Initialize form fields
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title' => __('Enable/Disable', 'team556-pay'),
                'type' => 'checkbox',
                'label' => __('Enable Team556 Pay', 'team556-pay'),
                'default' => 'no',
            ),
            'title' => array(
                'title' => __('Title', 'team556-pay'),
                'type' => 'text',
                'description' => __('This controls the title which the user sees during checkout.', 'team556-pay'),
                'default' => __('Team556 Token (Team556 Pay)', 'team556-pay'),
                'desc_tip' => true,
            ),
            'description' => array(
                'title' => __('Description', 'team556-pay'),
                'type' => 'textarea',
                'description' => __('This controls the description which the user sees during checkout.', 'team556-pay'),
                'default' => __('Pay with Team556 tokens via Team556 Pay. You will need a Team556 Digital Armory account with Team556 tokens.', 'team556-pay'),
            ),
            'wallet_address' => array(
                'title' => __('Merchant Wallet Address', 'team556-pay'),
                'type' => 'text',
                'description' => __('Enter your Team556 Digital Armory wallet address to receive payments. This field is synchronized with the main Team556 settings.', 'team556-pay'),
                'default' => '',
                'desc_tip' => true,
            ),
            'debug_mode' => array(
                'title' => __('Debug Mode', 'team556-pay'),
                'type' => 'checkbox',
                'label' => __('Enable debug mode', 'team556-pay'),
                'default' => 'no',
                'description' => __('Enable debug mode to log payment process details.', 'team556-pay')
            )
        );
    }

    /**
     * Enqueue payment scripts
     */
    public function payment_scripts() {
        if ('no' === $this->enabled) {
            return;
        }

        $is_checkout_wc = is_checkout(); // WooCommerce's own is_checkout()
        $is_order_pay_page = function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-pay');
        $is_add_payment_method_page = function_exists('is_add_payment_method_page') && is_add_payment_method_page();
        
        $checkout_page_id = function_exists('wc_get_page_id') ? wc_get_page_id('checkout') : 0;
        $current_page_id = get_queried_object_id(); // More reliable inside wp_enqueue_scripts
        $is_checkout_page_by_id_match = ($checkout_page_id && $current_page_id && $current_page_id == $checkout_page_id);

        $should_enqueue = false;

        if ($is_checkout_page_by_id_match) {
            $should_enqueue = true;
        } elseif ($is_checkout_wc) { // Fallback to WC's is_checkout()
            $should_enqueue = true;
        } elseif ($is_order_pay_page) {
            $should_enqueue = true;
        } elseif ($is_add_payment_method_page) {
            $should_enqueue = true;
        }

        if (!$should_enqueue) {
            return;
        }

        wp_enqueue_script('team556-buffer');
        wp_enqueue_script('team556-solana-web3');
        wp_enqueue_script('team556-qrcode');
        wp_enqueue_script('team556-pay'); 
        wp_enqueue_style('team556-pay-style');

        wp_localize_script('team556-pay', 'team556PayGateway', array(
            'ajaxUrl'                => admin_url('admin-ajax.php'),
            'completePaymentNonce'   => wp_create_nonce('team556-pay-complete-payment'),
            'merchantWallet'         => $this->wallet_address,
            'checkoutUrl'            => $this->get_return_url(null),
            'debugMode'              => $this->debug_mode === 'yes',
            'i18n'                   => array(
                'processingPayment' => __('Processing payment...', 'team556-pay'),
                'paymentConfirmed'  => __('Payment confirmed.', 'team556-pay'),
                'errorProcessing'   => __('Error processing payment.', 'team556-pay'),
            )
        ));
    }

    /**
     * Process the payment
     *
     * @param int $order_id
     * @return array
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        // Check if we received a transaction signature from the frontend
        if (isset($_POST['team556_pay_signature']) && !empty($_POST['team556_pay_signature'])) {
            $signature = sanitize_text_field($_POST['team556_pay_signature']);
            
            // Debug log
            if ($this->debug_mode === 'yes') {

            }
            
            // Store transaction signature in order meta
            $order->update_meta_data('_team556_pay_signature', $signature);
            
            // If reference is provided, store it as well
            if (isset($_POST['team556_pay_reference']) && !empty($_POST['team556_pay_reference'])) {
                $reference = sanitize_text_field($_POST['team556_pay_reference']);
                $order->update_meta_data('_team556_pay_reference', $reference);
                
                if ($this->debug_mode === 'yes') {

                }
            }
            
            // Mark payment as complete
            $order->payment_complete($signature);
            
            // Add transaction ID to order notes
            $order->add_order_note(sprintf(
                __('Team556 token payment completed via Team556 Pay. Transaction signature: %s', 'team556-pay'),
                $signature
            ));
            
            // Clear session data
            WC()->session->__unset('team556_pay_order_id');
            
            // Return success and redirect URL
            return array(
                'result' => 'success',
                'redirect' => $this->get_return_url($order)
            );
        }
        
        // If no signature was provided, we're starting the payment process
        // Mark as pending (we're awaiting the payment)
        $order->update_status('pending', __('Awaiting Team556 token payment via Team556 Pay QR code', 'team556-pay'));
        
        // Store order ID in session to retrieve it later
        WC()->session->set('team556_pay_order_id', $order_id);
        
        // Optionally, store the reference in the order metadata if present in the request
        if (isset($_POST['team556_pay_reference']) && !empty($_POST['team556_pay_reference'])) {
            $reference = sanitize_text_field($_POST['team556_pay_reference']);
            $order->update_meta_data('_team556_pay_reference', $reference);
            $order->save();
            
            if ($this->debug_mode === 'yes') {

            }
        }
        
        // Return checkout payment URL to redirect the customer
        return array(
            'result' => 'success',
            'redirect' => $order->get_checkout_payment_url(true),
        );
    }

    /**
     * AJAX handler for completing payment
     */
    public function ajax_complete_payment() {
        // Verify nonce
        check_ajax_referer('team556-pay-complete-payment', 'nonce');
        
        // Get parameters
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        $signature = isset($_POST['signature']) ? sanitize_text_field($_POST['signature']) : '';
        
        if (empty($order_id) || empty($signature)) {
            wp_send_json_error(array('message' => __('Missing required parameters', 'team556-pay')));
            exit;
        }
        
        // Get order
        $order = wc_get_order($order_id);
        if (!$order) {
            wp_send_json_error(array('message' => __('Order not found', 'team556-pay')));
            exit;
        }
        
        // Debug log
        if ($this->debug_mode === 'yes') {

        }
        
        // Verify the transaction on the blockchain
        // In production, you should verify the transaction details on the Solana blockchain
        // Here we'll assume the client-side verification is correct, but this isn't secure
        
        // For testing, allow simulated signatures in debug mode
        $valid_signature = true;
        if (strpos($signature, 'simulated_') === 0) {
            if ($this->debug_mode !== 'yes') {
                $valid_signature = false;
            }
        }
        
        if (!$valid_signature) {
            if ($this->debug_mode === 'yes') {

            }
            wp_send_json_error(array('message' => __('Payment validation failed', 'team556-pay')));
            exit;
        }
        
        // Mark payment complete
        $order->payment_complete();
        
        // Add transaction ID to order notes
        $order->add_order_note(sprintf(
            __('Team556 token payment completed via Solana Pay. Transaction signature: %s', 'team556-pay'),
            $signature
        ));
        
        // Store transaction signature in order meta
        $order->update_meta_data('_team556_pay_signature', $signature);
        $order->save();
        
        if ($this->debug_mode === 'yes') {

        }
        
        // Clear session data
        WC()->session->__unset('team556_pay_order_id');
        
        // Return success and redirect URL
        wp_send_json_success(array(
            'redirect' => $this->get_return_url($order)
        ));
        exit;
    }

    /**
     * Check for payment confirmation
     */
    public function check_payment() {
        global $woocommerce;
        
        $order_id = isset($_GET['order_id']) ? sanitize_text_field($_GET['order_id']) : '';
        $signature = isset($_GET['signature']) ? sanitize_text_field($_GET['signature']) : '';
        
        if (empty($order_id) || empty($signature)) {
            wp_redirect(wc_get_checkout_url());
            exit;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            wp_redirect(wc_get_checkout_url());
            exit;
        }
        
        // Mark payment complete (through our main handler)
        require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay.php';
        $plugin = new Team556_Solana_Pay();
        $verified = $plugin->verify_transaction_on_blockchain($signature, $order->get_total());
        
        if (!$verified) {
            // Payment verification failed
            $order->update_status('failed', __('Solana Pay payment verification failed.', 'team556-pay'));
            wc_add_notice(__('Payment verification failed. Please try again or contact support.', 'team556-pay'), 'error');
            wp_redirect(wc_get_checkout_url());
            exit;
        }
        
        // Payment verified, mark complete
        $order->payment_complete();
        $order->add_order_note(
            sprintf(
                __('Payment completed via Solana Pay. Transaction signature: %s', 'team556-pay'),
                $signature
            )
        );
        
        // Store transaction signature in order meta
        $order->update_meta_data('_team556_pay_signature', $signature);
        $order->save();
        
        // Empty cart
        WC()->cart->empty_cart();
        
        // Redirect to thank you page
        wp_redirect($this->get_return_url($order));
        exit;
    }

    public function payment_fields() {
        $this->log('[CRITICAL CHECK] Method entered.', 'payment_fields_entry');

        // Display the description if it's set
        if ($this->description) {
            echo '<p>' . wp_kses_post($this->description) . '</p>';
        }

        // Check for maximum order total
        $this->log('Checking max order total.', 'payment_fields_logic');
        $team556_pay_options = get_option('team556_pay_settings');
        $this->log('$team556_pay_options = ' . print_r($team556_pay_options, true), 'payment_fields_vars');

        $enable_max_total_limit = isset($team556_pay_options['enable_max_order_total']) && $team556_pay_options['enable_max_order_total'] == 1;
        $max_total_setting = isset($team556_pay_options['max_order_total']) ? $team556_pay_options['max_order_total'] : '';
        $this->log('$enable_max_total_limit = ' . ($enable_max_total_limit ? 'true' : 'false'), 'payment_fields_vars');
        $this->log('$max_total_setting = ' . $max_total_setting, 'payment_fields_vars');

        if (WC()->cart && $enable_max_total_limit && $max_total_setting !== '' && is_numeric($max_total_setting) && (float)$max_total_setting > 0) {
            $this->log('Max total check condition: TRUE.', 'payment_fields_logic');
            $max_total_value = (float) $max_total_setting;
            $current_cart_total = WC()->cart->get_total('edit');
            $this->log('$max_total_value = ' . $max_total_value, 'payment_fields_vars');
            $this->log('$current_cart_total = ' . $current_cart_total, 'payment_fields_vars');

            if ($current_cart_total > $max_total_value) {
                $this->log('Cart total EXCEEDS max. Displaying error.', 'payment_fields_logic');
                $message = sprintf(
                    // translators: %1$s is the current cart total, %2$s is the maximum allowed total.
                    __('Team556 Pay is currently unavailable because your order total of %1$s exceeds the merchant limit of %2$s for this payment method. Please adjust your cart or choose a different payment option.', 'team556-pay'),
                    wc_price($current_cart_total),
                    wc_price($max_total_value)
                );
                echo '<div class="woocommerce-error" role="alert">' . esc_html($message) . '</div>';
                return; // Do not display the payment interface
            } else {
            }
        } else {
        }

        // Check if there's an unavailability reason (for other critical issues from is_available())
        if (!empty($this->unavailability_reason)) {
            // Display the reason and do not show the payment interface
            echo '<div class="woocommerce-error" role="alert">' . esc_html($this->unavailability_reason) . '</div>';
        } else {
            // No unavailability reason, display the payment interface
            echo '<div id="team556-payment-react-app">';
            // The React app will be mounted here by JavaScript
            // You can add a loading message or placeholder if desired
            echo '<p>' . esc_html__('Loading payment options...', 'team556-pay') . '</p>';
            echo '</div>';

            // Enqueue scripts and localize data needed for the React app
            wp_enqueue_script('team556-pay'); // Corrected handle
            wp_localize_script('team556-pay', 'team556PayGatewayData', array( // Corrected handle
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce'    => wp_create_nonce('team556_pay_get_payment_data_nonce'),
                'debug_mode' => $this->debug_mode === 'yes',
                // Add any other data your React app needs from the gateway
            ));
        }

    }

    /**
     * Create Solana Pay URL
     */
    private function create_solana_pay_url($amount) {
        // Get the merchant wallet address
        $wallet_address = $this->wallet_address;
        // No fallback to test wallet for token mint, should always be the correct one.
        
        // Token mint is hardcoded for security and consistency with plugin requirements
        $token_mint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5'; // Corrected Team556 Token Mint
        
        // Format the TOKEN amount to a string with appropriate decimal places for the URL
        // Solana Pay spec usually implies the smallest unit of the token if not specified, 
        // but for SPL tokens, it's common to use the human-readable decimal amount.
        // Alchemy API provides price for 1 token, so $amount here should be the decimal token amount.
        // Let's use 6 decimal places for the URL, consistent with $team556_amount_formatted.
        $token_amount_str = number_format($amount, 6, '.', '');
        
        // Get shop name for label
        $shop_name = get_bloginfo('name');
        
        // Construct the Solana Pay URL
        $solana_pay_url = 'solana:' . $wallet_address . 
                         '?spl-token=' . $token_mint . 
                         '&amount=' . $token_amount_str . 
                         // '&reference=' . $reference . // Reference parameter removed as per Solana Pay spec for non-public key values
                         '&label=' . urlencode($shop_name) . 
                         '&message=' . urlencode('Payment for order at ' . $shop_name);
        
        // Log the URL if debug mode is enabled
        if ($this->debug_mode === 'yes') {
            }
        
        return $solana_pay_url;
    }

    /**
     * Fetch TEAM556 price data from Alchemy API with caching.
     *
     * @return array|false Price data array ['price' => float, 'last_updated' => timestamp, 'source' => 'cache'|'api'] or false on failure.
     */
    public function fetch_team556_price_data() {
        $transient_key = 'team556_main_api_price_data'; // Changed transient key
        $cached_data = get_transient($transient_key);

        if (false !== $cached_data && isset($cached_data['price'])) {
            $this->log_debug('TEAM556 Price: Returning cached data.');
            $cached_data['source'] = 'cache';
            return $cached_data;
        }

        $this->log_debug('TEAM556 Price: Cache miss or expired, fetching from main-api.');

        // The main-api URL is hardcoded for deployment.
        $main_api_base_url = 'http://localhost:3000'; 
        $api_url = $main_api_base_url . '/api/price/team556-usdc';

        if ($this->debug_mode === 'yes') {
            $this->log_debug('TEAM556 Price: Requesting URL: ' . $api_url);
        }

        $response = wp_remote_get($api_url, array(
            'timeout' => 10, // seconds
        ));

        if (is_wp_error($response)) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: WP Error fetching price: ' . $response->get_error_message());
            }
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ($this->debug_mode === 'yes') {
            $this->log_debug('TEAM556 Price: Response Status Code: ' . $status_code);
            $this->log_debug('TEAM556 Price: Response Body: ' . $body);
        }

        if ($status_code !== 200) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: API returned non-200 status: ' . $status_code);
            }
            return false;
        }

        $data = json_decode($body, true);

        // Expected main-api response structure: {"token":"TEAM556","price_usdc":0.00402045,"source":"alchemy","timestamp":"2024-07-15T20:05:56.17384Z"}
        if (empty($data) || !isset($data['price_usdc']) || !is_numeric($data['price_usdc'])) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: Invalid data structure or missing price_usdc from main-api response.');
            }
            return false;
        }

        $price_str = $data['price_usdc']; // Keep as string

        // Basic validation for the price string (e.g., is numeric, positive)
        // Using BCMath for comparison to handle string numbers accurately.
        if (!is_numeric($price_str) || bccomp($price_str, '0', 9) <= 0) { // 9 is the scale for comparison

            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: Price value is not positive: ' . $price_str);
            }
            return false;
        }

        $price_info = [
            'price'        => $price_str, // Store the string price
            'last_updated' => time(), // Use current time as last_updated from WP perspective
            'source'       => 'api (via main-api: ' . (isset($data['source']) ? $data['source'] : 'unknown') . ')',
            'api_timestamp'=> isset($data['timestamp']) ? $data['timestamp'] : null, // Store original timestamp from API
        ];

        set_transient($transient_key, $price_info, 60); // Cache for 60 seconds (increased from 10)

        if ($this->debug_mode === 'yes') {
            $this->log_debug('TEAM556 Price: Successfully fetched and cached. Price: ' . $price_str);
        }
        return $price_info;
    } // Closing brace for fetch_team556_price_data method
    
    /**
     * Check if the gateway is available for use.
     * Overridden for debugging purposes.
     *
     * @return bool
     */
    public function is_available() {
        // Check wallet_address specifically, considering global settings as per constructor logic
        $effective_wallet_address = $this->get_option('wallet_address');
        if (empty($effective_wallet_address)) {
            $global_settings = get_option('team556_pay_settings'); // This is the option name for global settings
            if (!empty($global_settings) && isset($global_settings['merchant_wallet_address'])) {
                $effective_wallet_address = $global_settings['merchant_wallet_address'];
            }
        }

        // Call parent::is_available() to get its decision
        $parent_is_available = parent::is_available();
        $this->log('Parent is_available() result: ' . ($parent_is_available ? 'TRUE' : 'FALSE'), 'is_available_path');

        if (!$parent_is_available) {
            // If parent says no (e.g., gateway disabled, currency mismatch), then it's definitively unavailable.
            $this->log('Path: Returning FALSE (due to parent).', 'is_available_path');
            return false;
        }

        // If parent is available, we proceed with our checks.
        $team556_pay_options = get_option('team556_pay_settings');

        // Check for required settings: wallet address from custom settings and token mint from constant
        $wallet_address_from_custom_settings = isset($team556_pay_options['merchant_wallet_address']) ? $team556_pay_options['merchant_wallet_address'] : '';
        $token_mint_constant = defined('TEAM556_PAY_TEAM556_TOKEN_MINT') ? TEAM556_PAY_TEAM556_TOKEN_MINT : '';

        if (empty($this->unavailability_reason) && (empty($wallet_address_from_custom_settings) || empty($token_mint_constant))) {
            $this->unavailability_reason = __('Team556 Pay is currently unavailable due to a configuration issue. Please contact support.', 'team556-pay');
        }

        // Check if cart total is zero or negative
        if (WC()->cart) {
            $this->log('Cart total for zero/negative check: ' . wc_price(WC()->cart->get_total('edit')) . ' (Raw: ' . WC()->cart->get_total('edit') . ')', 'is_available_cart_total');
        } else {
            $this->log('WC()->cart is not available for zero/negative check.', 'is_available_cart_total');
        }
        if (empty($this->unavailability_reason) && WC()->cart && WC()->cart->get_total('edit') <= 0) {
            $this->unavailability_reason = __('Team556 Pay cannot be used for orders with a zero or negative total.', 'team556-pay');
        }

        // Check for maximum order total
        $enable_max_total_limit = isset($team556_pay_options['enable_max_order_total']) && $team556_pay_options['enable_max_order_total'] == 1;
        $max_total_setting = isset($team556_pay_options['max_order_total']) ? $team556_pay_options['max_order_total'] : '';

        if (empty($this->unavailability_reason) && WC()->cart && $enable_max_total_limit && $max_total_setting !== '' && is_numeric($max_total_setting) && (float)$max_total_setting > 0) {
            $max_total_value = (float) $max_total_setting;
            $current_cart_total = WC()->cart->get_total('edit');
            if ($current_cart_total > $max_total_value) {
                $this->log('CHECKOUT_LIMIT_EXCEEDED: Cart total ' . wc_price($current_cart_total) . ' exceeds maximum ' . wc_price($max_total_value) . '. This will be handled in payment_fields().', 'team556_pay_checkout_limit');
                // Unavailability reason for max total is now handled in payment_fields()
                // to allow the gateway to be listed and show the message upon selection.
                // DO NOT set $this->unavailability_reason here for this specific case.
            }
        }

        // Log the final unavailability reason if one was set during the checks
        // And determine final availability
        if (!empty($this->unavailability_reason)) {
            return false; // If a reason was set by our custom checks, it's unavailable.
        }
        return true; // Otherwise, if parent was available and no custom reasons were set, it's available.
    }
    /**
     * Add CSS to ensure payment method is visible on all themes
     */
    public function add_payment_method_styles() {
        if (!is_checkout()) {
            return;
        }
        ?>
        <style type="text/css">
            /* Payment method selection - ensure visibility */
            .wc_payment_method label[for="payment_method_<?php echo esc_attr($this->id); ?>"] {
                color: <?php echo defined('TEAM556_PAY_BACKGROUND_DARKER') ? TEAM556_PAY_BACKGROUND_DARKER : '#14151A'; ?> !important;
                font-weight: 500;
                position: relative;
            }
            
            /* Style the radio label when selected */
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?>.active label,
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> input:checked + label {
                color: <?php echo defined('TEAM556_PAY_PRIMARY') ? TEAM556_PAY_PRIMARY : '#9945FF'; ?> !important;
                font-weight: 600;
            }
            
            /* Ensure payment gateway icon has good spacing */
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> img {
                margin-left: 8px;
                vertical-align: middle;
                max-height: 28px;
                width: auto;
                display: inline-block;
            }
            
            /* Description of payment method */
            .payment_box.payment_method_<?php echo esc_attr($this->id); ?> p {
                color: <?php echo defined('TEAM556_PAY_TEXT_TERTIARY') ? TEAM556_PAY_TEXT_TERTIARY : '#505050'; ?> !important;
            }
            
            /* Fix double checkbox issue by hiding the duplicate checkbox */
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> input[type="checkbox"] {
                display: none !important;
            }
            
            /* Hide any duplicate checkbox in payment gateway container */
            label[for="payment_method_<?php echo esc_attr($this->id); ?>"] input[type="checkbox"],
            #payment ul.payment_methods li.payment_method_<?php echo esc_attr($this->id); ?> input[type="checkbox"] {
                display: none !important;
            }
            
            /* Fix for themes that add additional inputs */
            .payment_method_<?php echo esc_attr($this->id); ?> label::before,
            .payment_method_<?php echo esc_attr($this->id); ?> label::after {
                display: none !important;
            }
            
            /* Additional styling for dark mode themes */
            body.dark-mode .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> label,
            .theme-dark .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> label,
            .dark-theme .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> label,
            .dark .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> label {
                color: <?php echo defined('TEAM556_PAY_TEXT') ? TEAM556_PAY_TEXT : '#ffffff'; ?> !important;
            }
        </style>
        <?php
    }

    /**
     * Fix gateway icon to prevent duplicate checkboxes
     */
    public function fix_gateway_icon($icon, $id) {
        if ($id === $this->id) {
            // Remove any input elements that might be in the icon HTML
            $icon = preg_replace('/<input[^>]*>/i', '', $icon);
        }
        return $icon;
    }
    
    /**
     * Fix gateway title to prevent duplicate checkboxes
     */
    public function fix_gateway_title($title, $gateway) {
        if (is_a($gateway, 'WC_Payment_Gateway') && $gateway->id === $this->id) {
            // Remove any input elements that might be in the title HTML
            $title = preg_replace('/<input[^>]*>/i', '', $title);
        }
        return $title;
    }
} 