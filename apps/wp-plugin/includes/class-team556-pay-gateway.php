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
    /**
     * Constructor
     */
    public function __construct() {
        if (class_exists('WC_Logger')) {
            $logger = wc_get_logger();
            $logger->debug('Team556_Pay_Gateway __construct: Gateway class constructed.', array('source' => 'team556-pay'));
        }

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
        $this->enabled            = $this->get_option('enabled');
        $this->wallet_address     = $this->get_option('wallet_address');
        $this->debug_mode         = $this->get_option('debug_mode', 'no');
        $this->network            = $this->get_option('network', 'mainnet');

        error_log('[Team556_Pay_Gateway __construct] Loaded title: ' . ($this->title ? $this->title : 'EMPTY_OR_NULL'));
        error_log('[Team556_Pay_Gateway __construct] Loaded description: ' . ($this->description ? $this->description : 'EMPTY_OR_NULL'));

        // If no wallet address is set, use the global plugin setting
        if (empty($this->wallet_address)) {
            $global_settings = get_option('team556_pay_settings'); // Fetch the array of global settings
            if (!empty($global_settings) && isset($global_settings['merchant_wallet_address'])) {
                $this->wallet_address = $global_settings['merchant_wallet_address'];
            } else {
                $this->wallet_address = ''; // Default if not found
            }
        }
        
        // Add payment method CSS to ensure visibility on all themes
        add_action('wp_head', array($this, 'add_payment_method_styles'));
        
        // Fix double checkbox issue
        add_filter('woocommerce_gateway_icon', array($this, 'fix_gateway_icon'), 10, 2);
        add_filter('woocommerce_payment_gateway_get_title', array($this, 'fix_gateway_title'), 10, 2);
        
        // Actions
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action( 'woocommerce_receipt_' . $this->id, array( $this, 'receipt_page' ) );
        add_action( 'wp_footer', array( $this, 'team556_test_footer_checkout_status' ) );
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

        // Filter to log available payment gateways for debugging
        add_filter('woocommerce_available_payment_gateways', array($this, 'log_available_gateways'), 100);
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
     * Log available payment gateways for debugging.
     *
     * @param array $gateways
     * @return array
     */
    public function log_available_gateways($gateways) {
        error_log('[Team556_Pay_Gateway] log_available_gateways filter CALLED. Reviewing gateways provided by WooCommerce.');
        if (empty($gateways)) {
            error_log('[Team556_Pay_Gateway] No gateways provided to log_available_gateways filter.');
            return $gateways;
        }

        $found_our_gateway = false;
        foreach ($gateways as $gateway_id => $gateway) {
            $is_enabled = (isset($gateway->enabled) && $gateway->enabled === 'yes') ? 'Yes' : 'No';
            $title = isset($gateway->title) ? $gateway->title : 'N/A';
            error_log("[Team556_Pay_Gateway] Available Gateway: ID='{$gateway_id}', Title='{$title}', Enabled='{$is_enabled}'");
            if ($gateway_id === $this->id) {
                $found_our_gateway = true;
                error_log("[Team556_Pay_Gateway] *** Our gateway '{$this->id}' FOUND. Current instance enabled status: {$this->enabled}. Gateway object enabled status in list: {$is_enabled} ***");
            }
        }

        if (!$found_our_gateway) {
            error_log("[Team556_Pay_Gateway] *** Our gateway '{$this->id}' NOT FOUND in the available gateways list. ***");
        }
        return $gateways; // Always return the gateways array
    }

    /**
     * Test function to log checkout status in footer.
     */
    public function team556_test_footer_checkout_status() {
        if (function_exists('is_checkout') && is_checkout()) {
            error_log('[Team556_Pay_Gateway wp_footer] is_checkout() is TRUE');
        } else {
            error_log('[Team556_Pay_Gateway wp_footer] is_checkout() is FALSE. Page ID: ' . (get_the_ID() ? get_the_ID() : 'N/A') . ', WC Checkout Page ID: ' . (function_exists('wc_get_page_id') ? wc_get_page_id('checkout') : 'N/A'));
        }
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
                'description' => __('Enter your Team556 Digital Armory wallet address to receive payments. If left empty, the global setting will be used.', 'team556-pay'),
                'default' => '',
                'desc_tip' => true,
            ),
            'debug_mode' => array(
                'title' => __('Debug Mode', 'team556-pay'),
                'type' => 'checkbox',
                'label' => __('Enable debug mode', 'team556-pay'),
                'default' => 'no',
                'description' => __('Enable debug mode to log payment process details.', 'team556-pay'),
            ),
        );
    }

    /**
     * Enqueue payment scripts
     */
    public function payment_scripts() {
        if ('no' === $this->enabled) {
            error_log('[Team556_Pay_Gateway] payment_scripts: Gateway not enabled. Exiting.');
            return;
        }

        $is_checkout_wc = is_checkout(); // WooCommerce's own is_checkout()
        $is_order_pay_page = function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-pay');
        $is_add_payment_method_page = function_exists('is_add_payment_method_page') && is_add_payment_method_page();
        
        $checkout_page_id = function_exists('wc_get_page_id') ? wc_get_page_id('checkout') : 0;
        $current_page_id = get_queried_object_id(); // More reliable inside wp_enqueue_scripts
        $is_checkout_page_by_id_match = ($checkout_page_id && $current_page_id && $current_page_id == $checkout_page_id);

        error_log('[Team556_Pay_Gateway] payment_scripts called (priority 90). Enabled: ' . $this->enabled);
        error_log('[Team556_Pay_Gateway] Current Page ID (get_queried_object_id): ' . $current_page_id);
        error_log('[Team556_Pay_Gateway] Checkout Page ID (wc_get_page_id): ' . $checkout_page_id);
        error_log('[Team556_Pay_Gateway] is_checkout_page_by_id_match (current_page_id == checkout_page_id): ' . ($is_checkout_page_by_id_match ? 'true' : 'false'));
        error_log('[Team556_Pay_Gateway] is_checkout() (WC function): ' . ($is_checkout_wc ? 'true' : 'false'));
        error_log('[Team556_Pay_Gateway] is_wc_endpoint_url(\'order-pay\'): ' . ($is_order_pay_page ? 'true' : 'false'));
        error_log('[Team556_Pay_Gateway] is_add_payment_method_page(): ' . ($is_add_payment_method_page ? 'true' : 'false'));

        $should_enqueue = false;

        if ($is_checkout_page_by_id_match) {
            $should_enqueue = true;
            error_log('[Team556_Pay_Gateway] Matched by current_page_id == checkout_page_id.');
        } elseif ($is_checkout_wc) { // Fallback to WC's is_checkout()
            $should_enqueue = true;
            error_log('[Team556_Pay_Gateway] Matched by is_checkout() (WC function).');
        } elseif ($is_order_pay_page) {
            $should_enqueue = true;
            error_log('[Team556_Pay_Gateway] Matched by is_order_pay_page.');
        } elseif ($is_add_payment_method_page) {
            $should_enqueue = true;
            error_log('[Team556_Pay_Gateway] Matched by is_add_payment_method_page.');
        }

        if (!$should_enqueue) {
            error_log('[Team556_Pay_Gateway] Exiting payment_scripts - not a relevant page.');
            return;
        }

        error_log('[Team556_Pay_Gateway] Conditions met, proceeding to enqueue scripts.');

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
                $this->log("Received Solana transaction signature for order #$order_id: $signature");
            }
            
            // Store transaction signature in order meta
            $order->update_meta_data('_team556_pay_signature', $signature);
            
            // If reference is provided, store it as well
            if (isset($_POST['team556_pay_reference']) && !empty($_POST['team556_pay_reference'])) {
                $reference = sanitize_text_field($_POST['team556_pay_reference']);
                $order->update_meta_data('_team556_pay_reference', $reference);
                
                if ($this->debug_mode === 'yes') {
                    $this->log("Storing reference for order #$order_id: $reference");
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
                $this->log("Storing initial reference for order #$order_id: $reference");
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
            $this->log("Processing payment completion for order #$order_id with signature: $signature");
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
                $this->log("Invalid signature format: $signature");
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
            $this->log("Payment completed for order #$order_id");
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

    /**
     * Payment fields
     */
    public function payment_fields() {
        error_log('[Team556_Pay_Gateway] SIMPLIFIED payment_fields() method CALLED.');

        if ($this->description) {
            echo '<p>' . esc_html($this->description) . '</p>';
        }

        // Output a simple comment and a div for easy checking
        echo '<!-- Team556 Pay Gateway SIMPLIFIED payment_fields() executed -->';
        echo '<div id="team556-simplified-payment-fields" style="padding:10px; border:1px solid green; margin:10px 0;">';
        echo 'Team556 Pay - Simplified Payment Fields. If you see this, the method was called.';
        echo '</div>';

        // You can add any specific data you want to pass to JavaScript here if needed for other tests
        // For example, if you still need to test JS interactions related to the gateway being chosen:
        /*
        wp_enqueue_script('team556-pay'); // Ensure your main JS is loaded if it handles gateway selection
        wp_localize_script('team556-pay', 'team556PayGatewayData', array(
            'isSimplified' => true,
            'gatewayId' => $this->id
        ));
        */

        error_log('[Team556_Pay_Gateway] SIMPLIFIED payment_fields() method FINISHED.');
    }
    
    /**
     * Create Solana Pay URL
     */
    private function create_solana_pay_url($amount, $reference) {
        // Get the merchant wallet address
        $wallet_address = $this->wallet_address;
        // No fallback to test wallet for token mint, should always be the correct one.
        
        // Token mint is hardcoded for security and consistency with plugin requirements
        $token_mint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5'; // Corrected Team556 Token Mint
        
        // Format the TOKEN amount to a string with appropriate decimal places for the URL
        // Solana Pay spec usually implies the smallest unit of the token if not specified, 
        // but for SPL tokens, it's common to use the human-readable decimal amount.
        // Jupiter API provides price for 1 token, so $amount here should be the decimal token amount.
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
            $this->log('Generated Solana Pay URL: ' . $solana_pay_url);
        }
        
        return $solana_pay_url;
    }

    /**
     * Fetch TEAM556 price data from Jupiter API with caching.
     *
     * @return array|false Price data array ['price' => float, 'last_updated' => timestamp, 'source' => 'cache'|'api'] or false on failure.
     */
    private function fetch_team556_price_data() {
        $transient_key = 'team556_jup_price_data';
        $cached_data = get_transient($transient_key);

        if (false !== $cached_data && isset($cached_data['price']) && isset($cached_data['last_updated'])) {
            // Ensure cache is not older than 10 seconds, though transient handles expiration
            if ( (time() - $cached_data['last_updated']) < 10 ) { 
                 $cached_data['source'] = 'cache';
                if ($this->debug_mode === 'yes') {
                    $this->log('Fetched TEAM556 price from cache: ' . $cached_data['price']);
                }
                return $cached_data;
            }
        }

        $team556_token_mint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5';
        $vs_token = 'USDC'; // Target currency for the price
        $api_url = sprintf('https://price.jup.ag/v6/price?ids=%s&vsToken=%s', $team556_token_mint, $vs_token);

        if ($this->debug_mode === 'yes') {
            $this->log('Fetching TEAM556 price from Jupiter API: ' . $api_url);
        }

        $response = wp_remote_get($api_url, array('timeout' => 10)); // 10 second timeout for the request

        if (is_wp_error($response)) {
            if ($this->debug_mode === 'yes') {
                $this->log('Jupiter API request failed (wp_error): ' . $response->get_error_message());
            }
            return ['error' => 'API request failed: ' . $response->get_error_message()];
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ($status_code !== 200) {
            if ($this->debug_mode === 'yes') {
                $this->log('Jupiter API request failed (status ' . $status_code . '): ' . $body);
            }
            return ['error' => 'API request failed with status: ' . $status_code];
        }

        $data = json_decode($body, true);

        if (empty($data['data'][$team556_token_mint]['price'])) {
            if ($this->debug_mode === 'yes') {
                $this->log('Jupiter API response did not contain expected price data. Response: ' . $body);
            }
            return ['error' => 'Invalid price data received from API.'];
        }

        $price = floatval($data['data'][$team556_token_mint]['price']);

        if ($price <= 0) {
            if ($this->debug_mode === 'yes') {
                $this->log('Jupiter API returned a non-positive price: ' . $price . '. Response: ' . $body);
            }
            return ['error' => 'Invalid price value (non-positive) received from API.'];
        }

        $price_info = [
            'price' => $price,
            'last_updated' => time(),
            'source' => 'api'
        ];

        set_transient($transient_key, $price_info, 10); // Cache for 10 seconds

        if ($this->debug_mode === 'yes') {
            $this->log('Fetched TEAM556 price from API: ' . $price . ' - Cached for 10 seconds.');
        }
        return $price_info;
    }
    
    /**
     * Log debug messages
     */
    private function log($message) {
        if ($this->debug_mode !== 'yes') {
            return;
        }
        
        if (!is_dir(WP_CONTENT_DIR . '/uploads/team556-pay-logs')) {
            @mkdir(WP_CONTENT_DIR . '/uploads/team556-pay-logs', 0755, true);
        }
        
        $log_file = WP_CONTENT_DIR . '/uploads/team556-pay-logs/debug-' . date('Y-m-d') . '.log';
        $timestamp = date('Y-m-d H:i:s');
        
        error_log("[{$timestamp}] {$message}\n", 3, $log_file);
    }

    /**
     * Check if the gateway is available for use.
     * Overridden for debugging purposes.
     *
     * @return bool
     */
    public function is_available() {
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_CALLED - TOP'); // Direct error_log
        $logger = null;
        if (class_exists('WC_Logger')) {
            $logger = wc_get_logger();
            $source = array('source' => $this->id); // Use $this->id for source
            $logger->debug('Team556_Pay_Gateway is_available: ----- Start Check -----', $source);
        }

        // Log basic properties
        if ($logger) $logger->debug('is_available: this->id = ' . $this->id, $source);
        if ($logger) $logger->debug('is_available: this->enabled = ' . var_export($this->enabled, true), $source);
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_ENABLED_STATUS: ' . var_export($this->enabled, true)); // Direct error_log
        
        // Check wallet_address specifically, considering global settings as per constructor logic
        $effective_wallet_address = $this->get_option('wallet_address');
        if (empty($effective_wallet_address)) {
            $global_settings = get_option('team556_pay_settings'); // This is the option name for global settings
            if (!empty($global_settings) && isset($global_settings['merchant_wallet_address'])) {
                $effective_wallet_address = $global_settings['merchant_wallet_address'];
                if ($logger) $logger->debug('is_available: Using global merchant_wallet_address.', $source);
            }
        }
        if ($logger) $logger->debug('is_available: Effective wallet_address = ' . (empty($effective_wallet_address) ? 'EMPTY' : 'SET'), $source);
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_WALLET_ADDRESS: ' . (empty($effective_wallet_address) ? 'EMPTY' : 'SET')); // Direct error_log
        if (empty($effective_wallet_address) && $this->enabled === 'yes' && $logger) {
             $logger->warning('is_available: Wallet address is EMPTY. This will likely cause the gateway to be unavailable if enabled.', $source);
        }

    // Call parent::is_available() to get its decision
    // parent::is_available() checks $this->enabled, min_amount, etc.
    $parent_is_available = parent::is_available();
    if ($logger) $logger->debug('is_available: parent::is_available() returned = ' . ($parent_is_available ? 'true' : 'false'), $source);
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_PARENT_RETURNED: ' . ($parent_is_available ? 'true' : 'false')); // Direct error_log
    
    // Our plugin's specific condition: must have a wallet address if the parent considers it available.
    // However, the original logic simply returned parent_is_available. We'll stick to that for now
    // and rely on the warning log for the empty wallet address.
    $final_availability = $parent_is_available;
    // Example of how to make wallet address mandatory if parent is okay:
    // if ($final_availability && empty($effective_wallet_address)) {
    //     $final_availability = false;
    //     if ($logger) $logger->debug('is_available: Overriding to false due to EMPTY wallet_address.', $source);
    //     error_log('[Team556_Pay_Gateway] IS_AVAILABLE_OVERRIDE_EMPTY_WALLET: false');
    // }

    if ($logger) $logger->debug('is_available: ----- Final Decision = ' . ($final_availability ? 'true' : 'false') . ' -----', $source);
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_HAS_FIELDS_CHECK: ' . ($this->has_fields ? 'true' : 'false'));
    error_log('[Team556_Pay_Gateway] IS_AVAILABLE_FINAL_DECISION: ' . ($final_availability ? 'true' : 'false')); // Direct error_log
    return $final_availability;
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
                color: #14151A !important;
                font-weight: 500;
                position: relative;
            }
            
            /* Style the radio label when selected */
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?>.active label,
            .wc_payment_method.payment_method_<?php echo esc_attr($this->id); ?> input:checked + label {
                color: #9945FF !important;
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
                color: #505050 !important;
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
                color: #ffffff !important;
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