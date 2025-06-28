<?php
/**
 * Main plugin class
 */
class Team556_Pay {
    /**
     * General Logger instance
     *
     * @var WC_Logger
     */
    private $logger = null;
    
    /**
     * Order Status Logger instance
     *
     * @var WC_Logger
     */
    private $order_status_logger = null;
    private $log_context = array( 'source' => 'team556-confirmation' // );
    
    // Option name for tracking REST API initialization
    const REST_API_INIT_OPTION = 'team556_rest_api_init_timestamp';
    
    /**
     * Holds the singleton instance
     *
     * @var Team556_Pay
     */
    private static $instance = null;

    /**
     * Static variable to track if routes have been registered in this PHP process
     * This will persist for the entire WordPress load regardless of how many times
     * the class is instantiated
     */
    private static $routes_registered = false;

    /**
     * Constructor - private to enforce singleton pattern.
     */
    private function __construct() {
        if (class_exists('WC_Logger')) {
            // Initialize the general logger
            $this->logger = new WC_Logger(// );
            // $this->log_context = array('source' => 'team556-confirmation'// );
            
            // Initialize the dedicated order status logger
            $this->order_status_logger = new WC_Logger(// );
            
            // Get the unique request ID for logging
            $request_id = $this->get_unique_request_id(// );
            // $this->logger->debug("Team556_Pay constructor called. Request ID: {$request_id}", // $this->log_context// );
            $this->log_order_status("Team556 Pay plugin initialized", 'init'// );
        } else {
            // Fallback notice if WooCommerce logger is truly unavailable
            if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
                trigger_error( 'Team556_Pay: WC_Logger class not found.', E_USER_NOTICE // );
            }
        }
        
        // CRITICAL: Only add hook if routes have NOT been registered in this PHP process
        if (!self::$routes_registered) {
            // Set the static flag - this is the only place we check/set it
            self::$routes_registered = true;
            
            // Update timestamp of last route registration
            update_option(self::REST_API_INIT_OPTION, time()// );
            
            // Add hook for REST API route registration
            // Register on both rest_api_init and init for maximum compatibility
            add_action('rest_api_init', array($this, 'register_rest_routes'), 10// ); 
            add_action('init', array($this, 'register_rest_routes'), 999// );
            
//            if ($this->logger) {
                // $this->logger->debug(
                    // "Adding hooks for REST route registration. Request ID: {$request_id}\n" .
                    // "Static flag set to prevent multiple registrations in this process.",
                    // $this->log_context
                // );
            }
            
            // Force flush rewrite rules if not done recently (once per day)
            $last_flush = get_option('team556_last_flush_rewrite', 0// );
            $day_in_seconds = 86400;
            
            if (time() - $last_flush > $day_in_seconds) {
                if ($this->logger) // $this->logger->debug(
                    // // "Will flush rewrite rules (not done in >24 hours)", 
                    // $this->log_context
                
                add_action('wp_loaded', function() use ($request_id) {
                    flush_rewrite_rules(true// );
                    update_option('team556_last_flush_rewrite', time()// );
//                     if ($this->logger) // $this->logger->debug(
                        // "Rewrite rules flushed successfully. Request ID: {$request_id}"//                          // $this->log_context
                    // // );
                }// );
            }
        } else if ($this->logger) {
            // $this->logger->debug(
//                 "Skipping REST route registration - already registered in this process. Request ID: {$request_id}",
                // $this->log_context
            // );
        }
    }

    /**
     * Get the singleton instance of this class.
     *
     * @return Team556_Pay The singleton instance.
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self(// );
        }
        return self::$instance;
    }

    /**
     * Initialize the plugin
     */
    public function init() {
        // Add hooks
        add_action('init', array($this, 'register_scripts')// );
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'), 90// ); // Run a bit later
        // The rest_api_init hook is already added in the constructor.
        
        // AJAX hooks
        add_action('wp_ajax_team556_check_payment_status', array($this, 'ajax_check_payment_status')// );
        add_action('wp_ajax_nopriv_team556_check_payment_status', array($this, 'ajax_check_payment_status')// ); // For non-logged in users
        
        // Add WooCommerce payment gateway if WooCommerce is active
        if ($this->is_woocommerce_active()) {
            add_filter('woocommerce_payment_gateways', array($this, 'add_pay_gateway')// );
            require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-gateway.php';
        }
        
        // Add shortcode
        add_shortcode('team556_pay', array($this, 'payment_shortcode')// );

        // AJAX hook for checking payment status
        add_action('wp_ajax_team556_solana_pay_check_payment', array($this, 'ajax_check_payment_status')// );
        add_action('wp_ajax_nopriv_team556_solana_pay_check_payment', array($this, 'ajax_check_payment_status')// );
        
        // Add AJAX handler for verifying transactions
        add_action('wp_ajax_team556_verify_transaction', array($this, 'ajax_verify_transaction')// );
        add_action('wp_ajax_nopriv_team556_verify_transaction', array($this, 'ajax_verify_transaction')// );
        
        // Add AJAX handler for checking payment status
        add_action('wp_ajax_team556_check_payment_status', array($this, 'ajax_check_payment_status')// );
        add_action('wp_ajax_nopriv_team556_check_payment_status', array($this, 'ajax_check_payment_status')// );

        // Add AJAX handler for checking order status (static handler in gateway class)
        // This ensures the handler is available even if the gateway object isn't instantiated for the AJAX call.
        // Ensure Team556_Pay_Gateway class is loaded before this hook is effective.
        // The require_once for class-team556-pay-gateway.php is typically handled within the woocommerce_payment_gateways filter or earlier.
        add_action('wp_ajax_team556_pay_check_order_status', array('Team556_Pay_Gateway', 'static_ajax_check_order_status_handler')// );
        add_action('wp_ajax_nopriv_team556_pay_check_order_status', array('Team556_Pay_Gateway', 'static_ajax_check_order_status_handler')// );
    }

    /**
     * Register scripts
     */
    public function register_scripts() {

        // Register Solana Pay scripts
        wp_register_script(
            'team556-solana-web3',
            'https://unpkg.com/@solana/web3.js@1.73.0/lib/index.iife.min.js',
            array(),
            TEAM556_PAY_VERSION,
            true
        // );
        
        // Register Buffer polyfill for browser compatibility (inline only)
        wp_register_script(
            'team556-buffer',
            '', // Empty URL - just for inline script
            array(),
            '1.0.0',
            true
        // );
        
        // Add inline script to create Buffer global for browser compatibility
        wp_add_inline_script(
            'team556-buffer',
            '
            // Browser-compatible Buffer polyfill
            if (typeof window !== "undefined" && !window.Buffer) {
                window.Buffer = {
                    alloc: function(size) {
                        return new Uint8Array(size// );
                    },
                    from: function(data) {
                        if (Array.isArray(data)) {
                            return new Uint8Array(data// );
                        }
                        if (typeof data === "string") {
                            return new TextEncoder().encode(data// );
                        }
                        return new Uint8Array(data// );
                    }
                };
            }
            ',
            'after'
        // );
        
        // Register QR Code library
        wp_register_script(
            'team556-qrcode',
            'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js',
            array(),
            '1.5.1',
            true
        // );

        // Register our custom script
        wp_register_script(
            'team556-pay',
            TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-pay.js',
            array('jquery', 'team556-buffer', 'team556-solana-web3', 'team556-qrcode'),
            TEAM556_PAY_VERSION,
            true
        // );
        
        // Register public-facing script for payment status polling
        wp_register_script(
            'team556-public',
            TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-public.js',
            array('jquery', 'team556-qrcode'),
            TEAM556_PAY_VERSION,
            true
        // );

        // Register styles
        wp_register_style(
            'team556-pay-style',
            TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-pay.css',
            array(),
            TEAM556_PAY_VERSION
        // );
    }

    /**
     * Enqueue frontend scripts
     */
    public function enqueue_frontend_scripts() {
	    $is_checkout = function_exists('is_checkout') && is_checkout(// );
	    $is_order_pay_page = function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-pay'// );
	    $is_shortcode_present = $this->is_team556_pay_shortcode_present(// );
	    $is_cart = function_exists('is_cart') && is_cart(// );
	    $checkout_page_id = function_exists('wc_get_page_id') ? wc_get_page_id('checkout') : 0;
	    $current_page_id = get_queried_object_id(// ); // More reliable inside wp_enqueue_scripts
	    $is_checkout_page_by_id = ($checkout_page_id && $current_page_id && $current_page_id == $checkout_page_id// );
	    // $is_checkout_page_by_is_page = function_exists('wc_get_page_id') && is_page(wc_get_page_id('checkout')// ); // Alternative, often less reliable during AJAX











	    $should_enqueue = false;

	    if ($is_checkout_page_by_id) {
	        $should_enqueue = true;

	    } elseif ($is_shortcode_present) {
	        $should_enqueue = true;

	    } elseif ($is_checkout) { // Fallback to is_checkout
	        $should_enqueue = true;

	    } elseif ($is_order_pay_page) { // Fallback to order-pay page
	        $should_enqueue = true;

	    }
	    // Not including $is_cart as it's usually too broad for payment gateway specific scripts.

	    if ($should_enqueue) {

	        wp_enqueue_script('team556-buffer'// );
	        wp_enqueue_script('team556-solana-web3'// );
	        wp_enqueue_script('team556-qrcode'// ); // Added qrcode
	        wp_enqueue_script('team556-pay'// );
	        wp_enqueue_script('team556-public'// ); // Add public-facing script for payment polling
	        wp_enqueue_style('team556-pay-style'// );
	        
	        // Localize the main payment script
	        wp_localize_script('team556-pay', 'team556PayGlobal', array(
	            'ajaxUrl' => admin_url('admin-ajax.php'),
	            'restUrl' => rest_url('team556-pay/v1'),
	            'merchantWallet' => get_option('team556_pay_wallet_address', ''),
	            'tokenMint' => get_option('team556_pay_token_mint', 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg'),
	            'network' => get_option('team556_pay_network', 'mainnet'),
	            'nonce' => wp_create_nonce('team556-pay-nonce'),
	            'i18n' => array(
	                'paymentSuccess' => get_option('team556_pay_success_message', __('Payment successful!', 'team556-pay')),
	                'paymentFailed' => get_option('team556_pay_error_message', __('Payment failed. Please try again.', 'team556-pay')),
	                'connecting' => __('Connecting to wallet...', 'team556-pay'),
	                'connected' => __('Connected to wallet', 'team556-pay'),
	                'connectionFailed' => __('Connection failed', 'team556-pay'),
	                'payNow' => get_option('team556_pay_button_text', __('Pay with Team556 Token', 'team556-pay')),
	            ),
	        )// );
	        
	        // Localize the public script for payment status polling
	        wp_localize_script('team556-public', 'team556_ajax_obj', array(
	            'ajax_url' => admin_url('admin-ajax.php'),
	            'nonce' => wp_create_nonce('team556-pay-check-payment'),
	            'site_url' => site_url(),
	            'order_page_url' => wc_get_endpoint_url('orders', '', wc_get_page_permalink('myaccount')),
	            'is_checkout' => is_checkout() ? 'yes' : 'no'
	        )// );
	        
	    } else {

	    }
	}

    /**
     * Check if the [team556_pay] shortcode is present on the current page/post.
     * 
     * @return bool True if the shortcode is found, false otherwise.
     */
    public function is_team556_pay_shortcode_present() {
        global $post;
        if (is_a($post, 'WP_Post')) {
            // Check if the post content contains the shortcode
            $content = $post->post_content;
            if (has_shortcode($content, 'team556_pay')) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Register REST API routes for the plugin
     * This method might be called multiple times but we ensure routes are only registered once
     */
    public function register_rest_routes() {
        static $routes_added = false;
        $request_id = $this->get_unique_request_id(// );
        
        // Extra protection - only register routes once per method call across all instances
        if ($routes_added) {
            if ($this->logger) // $this->logger->debug(
                "Routes already registered within this method. Skipping. Request ID: {$request_id}",
                // $this->log_context
            // );
            return;
        }
        
        // Set local static flag to prevent duplicate registrations within this method
        $routes_added = true;
        
        if ($this->logger) // $this->logger->debug(
            "REGISTERING ROUTES - Request ID: {$request_id}", 
            // $this->log_context
        // );
        
        // Load the verifier class to handle callbacks
        require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-verifier.php';
        $this->verifier = new Team556_Pay_Verifier(// );
        
        $namespace = 'team556-pay/v1';
        
        // Register critical webhook endpoint for payment verification
        register_rest_route($namespace, '/verify-payment', array(
            'methods' => array('POST', 'GET'),
            'callback' => array($this, 'proxy_webhook_handler'), // Use the proxy handler
            'permission_callback' => '__return_true', // Publicly accessible
        )// );
        if ($this->logger) // $this->logger->debug("Route registered: /{$namespace}/verify-payment [POST,GET]", // $this->log_context// );
        
        // Register OPTIONS method separately for CORS preflight requests
        register_rest_route($namespace, '/verify-payment', array(
            'methods' => 'OPTIONS',
            'callback' => array($this, 'handle_cors_preflight'),
            'permission_callback' => '__return_true',
        )// );
        if ($this->logger) // $this->logger->debug("CORS OPTIONS route registered: /{$namespace}/verify-payment [OPTIONS]", // $this->log_context// );

        // Register healthcheck endpoint
        register_rest_route($namespace, '/healthcheck', array(
            'methods' => WP_REST_Server::READABLE, // GET
            'callback' => array($this, 'rest_healthcheck'),
            'permission_callback' => '__return_true',
        )// );
        if ($this->logger) // $this->logger->debug("Route registered: /{$namespace}/healthcheck [GET]", // $this->log_context// );
        
        // Add special CORS headers for all REST API responses
        add_filter('rest_pre_serve_request', array($this, 'add_cors_headers'), 10, 4// );
    }

    /**
     * Proxy handler for the webhook to debug callback execution.
     */
    public function proxy_webhook_handler(WP_REST_Request $request) {
        if ($this->logger) // $this->logger->debug('PROXY HANDLER CALLED! Relaying to verifier.', // $this->log_context// );
        
        if ($this->verifier && method_exists($this->verifier, 'handle_payment_verification_request')) {
            return $this->verifier->handle_payment_verification_request($request// );
        } else {
            if ($this->logger) $this->logger->error('FATAL: Verifier object or method not available in proxy handler.', // $this->log_context// );
            return new WP_Error('verifier_not_found', 'The payment verifier is not available.', array('status' => 500)// );
        }
    }

    /**
     * Handle CORS preflight requests for the webhook.
     */
    public function handle_cors_preflight() {
        return new WP_REST_Response(null, 200// );
    }

    /**
     * Add CORS headers to all REST API responses.
     */
    public function add_cors_headers($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: *'// );
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS'// );
        header('Access-Control-Allow-Credentials: true'// );
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce'// );
        return $served;
    }


    /**
     * Get a unique request ID for the current PHP process.
     * 
     * @return string Unique request ID for the current request
     */
    private function get_unique_request_id() {
        // Use a truly static variable to ensure the same ID is returned 
        // for the entire PHP process (all instances, all executions)
        static $request_id = null;
        
        if ($request_id === null) {
            $request_id = 'req_' . uniqid('', true// );
            if ($this->logger) // $this->logger->debug('Generated new request ID: ' . $request_id, // $this->log_context// );
        }
        
        return $request_id;
    }
    
    /**
     * Log order status events to a dedicated WooCommerce log file
     *
     * @param string $message The message to log
     * @param string $status Status indicator (success, error, pending, init, etc.)
     * @param int $order_id Optional WooCommerce order ID
     * @return void
     */
    public function log_order_status($message, $status = 'info', $order_id = null) {
        if (!$this->order_status_logger) {
            if (class_exists('WC_Logger')) {
                $this->order_status_logger = new WC_Logger(// );
            } else {
                if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
                    trigger_error( 'Team556 Pay: Cannot log order status - WC_Logger not available', E_USER_NOTICE // );
                }
                return;
            }
        }
        
        // Define status emojis for better visual identification
        $emoji = '📋'; // Default
        switch ($status) {
            case 'success':
            case 'paid':
                $emoji = '✅';
                break;
            case 'error':
            case 'failed':
                $emoji = '❌';
                break;
            case 'pending':
                $emoji = '⏳';
                break;
            case 'init':
                $emoji = '🚀';
                break;
            case 'verify':
                $emoji = '🔍';
                break;
            case 'api':
                $emoji = '🌐';
                break;
            case 'notify':
                $emoji = '📢';
                break;
            case 'debug':
                $emoji = '🐛';
                break;
        }
        
        // Format message with order ID if available
        $formatted_message = $emoji . ' TEAM556 ORDER STATUS';
        if ($order_id) {
            $formatted_message .= " - Order #{$order_id}";
        }
        $formatted_message .= ": {$message}";
        
        // Log with source that will show in WooCommerce status log list
        // $this->order_status_logger->add('team556-order-status', $formatted_message// );
    }
    
    /**
     * Handle the healthcheck REST API request.
     */
    public function rest_healthcheck() {
        // Add debug information to response
        $debug_info = array(
            'status' => 'ok',
            'message' => 'Team556 Pay plugin is alive!',
            'timestamp' => current_time('mysql'),
            'request_id' => $this->get_unique_request_id(),
            'rest_api_init' => get_option(self::REST_API_INIT_OPTION, 0),
        // );
        
        if ($this->logger) // $this->logger->debug('Healthcheck endpoint called with response: ' . json_encode($debug_info), // $this->log_context// );
        
        return new WP_REST_Response($debug_info, 200// );
    }

    /**
     * AJAX handler for verifying transactions
     */
    public function ajax_verify_transaction() {
        // Check nonce
        check_ajax_referer('team556-pay-nonce', 'nonce'// );
        
        // Get parameters
        $signature = isset($_POST['signature']) ? sanitize_text_field($_POST['signature']) : '';
        $amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        
        // Verify the transaction
        $verified = $this->verify_transaction_on_blockchain($signature, $amount// );
        
        if (!$verified) {
            wp_send_json_error(array('message' => 'Transaction verification failed')// );
            exit;
        }
        
        // If this is a WooCommerce order, update its status
        if ($order_id && $this->is_woocommerce_active()) {
            $order = wc_get_order($order_id// );
            if ($order) {
                $order->payment_complete(// );
                $order->add_order_note(
                    sprintf(
                        __('Payment completed via Solana Pay. Transaction signature: %s', 'team556-pay'),
                        $signature
                    )
                // );
                
                // Store the transaction signature in order meta
                $order->update_meta_data('_team556_solana_pay_signature', $signature// );
                $order->save(// );
            }
        }
        
        // Log the transaction in our database
        $this->log_transaction($signature, $amount, $order_id// );
        
        // Return success
        wp_send_json_success(array(
            'message' => 'Transaction verified successfully',
            'redirect' => $order_id ? $order->get_checkout_order_received_url() : ''
        )// );
        exit;
    }


    
    /**
     * Verify transaction on blockchain
     */
    public function verify_transaction_on_blockchain($signature, $amount) {
        // Get merchant wallet address
        $wallet_address = get_option('team556_solana_pay_wallet_address', ''// );
        
        if (empty($wallet_address)) {
            return false;
        }
        
        // Get network
        $network = get_option('team556_solana_pay_network', 'mainnet'// );
        
        // Initialize verifier
        $debug_mode = get_option('team556_solana_pay_debug_mode', '0') === '1';
        $verifier = new Team556_Pay_Verifier($debug_mode// );
        
        // Verify transaction
        return $verifier->verify_transaction(
            $signature,
            $wallet_address,
            $amount,
            $network
        // );
    }
    
    /**
     * Log transaction in database
     * 
     * @param string $signature Transaction signature
     * @param float $amount Transaction amount
     * @param int $order_id WooCommerce order ID if applicable
     * @return void
     */
    private function log_transaction($signature, $amount, $order_id = null) {
        // Get our database class
        require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-db.php';
        $db = new Team556_Pay_DB(// );
        
        // Log the transaction
        $db->log_transaction(array(
            'transaction_signature' => $signature,
            'wallet_address' => get_option('team556_solana_pay_wallet_address', ''),
            'amount' => $amount,
            'order_id' => $order_id,
            'status' => 'completed',
            'metadata' => array(
                'token_mint' => get_option('team556_solana_pay_token_mint', 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg'),
                'network' => get_option('team556_solana_pay_network', 'mainnet'),
            ),
        )// );
    }

    /**
     * Add Solana Pay gateway to WooCommerce
     */
    public function add_pay_gateway($gateways) {
        $gateways[] = 'Team556_Pay_Gateway';
        return $gateways;
    }

    /**
     * Payment shortcode
     */
    public function payment_shortcode($atts) {
        $atts = shortcode_atts(array(
            'amount' => '0',
            'description' => '',
            'button_text' => get_option('team556_solana_pay_button_text', __('Pay with Team556 Token', 'team556-pay')),
            'success_url' => '',
            'cancel_url' => '',
        ), $atts// );
        
        // Enqueue scripts
        wp_enqueue_script('team556-buffer'// );
        wp_enqueue_script('team556-solana-web3'// );
        wp_enqueue_script('team556-pay'// );
        wp_enqueue_style('team556-pay-style'// );
        
        // Get button color from settings
        $button_color = get_option('team556_solana_pay_button_color', '#9945FF'// );
        
        ob_start(// );
        ?>
        <div class="team556-pay-container" 
            data-amount="<?php echo esc_attr($atts['amount']// ); ?>" 
            data-description="<?php echo esc_attr($atts['description']// ); ?>" 
            data-success-url="<?php echo esc_url($atts['success_url']// ); ?>" 
            data-cancel-url="<?php echo esc_url($atts['cancel_url']// ); ?>">
            
            <button class="team556-pay-button" style="background-color: <?php echo esc_attr($button_color// ); ?>">
                <?php echo esc_html($atts['button_text']// ); ?>
            </button>
            
            <div class="team556-pay-status"></div>
        </div>
        <?php
        return ob_get_clean(// );
    }

    /**
     * Check if WooCommerce is active
     */
    private function is_woocommerce_active() {
        return in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins'))// );
    }
    
    /**
     * AJAX handler for checking payment status
     */
    public function ajax_check_payment_status() {
        // Get the singleton instance to access the order status logger
        $instance = self::get_instance(// );
        
        // Log that the payment check was initiated
        $instance->log_order_status('AJAX payment check handler triggered', 'debug'// );
        
        try {
            if (!isset($_POST['reference']) || empty($_POST['reference'])) {
                $instance->log_order_status('Missing reference parameter in AJAX request', 'error'// );
                wp_send_json_error(array('message' => 'Missing reference parameter')// );
                return;
            }
            
            $reference = sanitize_text_field($_POST['reference']// );
            $instance->log_order_status("Processing payment check for reference: {$reference}", 'verify'// );
            
            // Get order ID if provided
            $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
            
            if ($order_id) {
                $order = wc_get_order($order_id// );
                if (!$order) {
                    $instance->log_order_status("Invalid order ID: {$order_id}", 'error'// );
                    wp_send_json_error(array('message' => 'Invalid order ID')// );
                    return;
                }
                
                $instance->log_order_status("Found order #{$order_id}, status: {$order->get_status()}", 'verify', $order_id// );
                
                // Check if order is already paid
                if ($order->is_paid() || in_array($order->get_status(), array('processing', 'completed'))) {
                    $instance->log_order_status("Order is already marked as paid", 'success', $order_id// );
                    wp_send_json_success(array(
                        'status' => 'paid',
                        'redirect_url' => $order->get_checkout_order_received_url(),
                        'message' => 'Payment already confirmed'
                    )// );
                    return;
                }
            }
            
            // Instantiate the transaction verifier
            $verifier = new Team556_Pay_Verifier(// );
            $transaction = $verifier->find_payment_by_reference($reference// );
            
            if ($transaction) {
                $instance->log_order_status(
                    "Transaction found with signature: {$transaction->signature}", 
                    'success', 
                    $order_id
                // );
                
                // If we have an order, update it
                if ($order_id && isset($order)) {
                    // Fetch TEAM556 price data for verification
                    $gateway = new Team556_Pay_Gateway(// );
                    $price_data = $gateway->fetch_team556_price_data(// );
                    
                    if ($price_data !== false) {
                        // Verify the transaction amount matches the order amount
                        $order_total = $order->get_total(// );
                        $token_price = $price_data['price'];
                        $token_decimals = 9; // Team556 has 9 decimals
                        
                        // Calculate how many tokens should have been sent
                        $expected_tokens = $order_total / $token_price;
                        $expected_token_amount = $expected_tokens * (10 ** $token_decimals// );
                        
                        // Get the actual tokens sent
                        $actual_token_amount = $transaction->amount;
                        
                        // Allow a 2% difference to account for price fluctuations and rounding
                        $min_acceptable = $expected_token_amount * 0.98;
                        $verification_result = $actual_token_amount >= $min_acceptable;
                        
                        $instance->log_order_status(
                            "Payment verification: Expected {$expected_token_amount} tokens, received {$actual_token_amount} tokens. " . 
                            ($verification_result ? 'VERIFIED' : 'FAILED'), 
                            $verification_result ? 'success' : 'error', 
                            $order_id
                        // );
                        
                        if ($verification_result) {
                            // Update order meta with transaction information
                            $order->add_meta_data('_team556_transaction_signature', $transaction->signature, true// );
                            $order->add_meta_data('_team556_transaction_timestamp', $transaction->timestamp, true// );
                            $order->add_meta_data('_team556_transaction_amount', $transaction->amount, true// );
                            
                            // Add a note to the order
                            $order->add_order_note(
                                sprintf(
                                    __('Payment completed via Team556 Pay. Transaction signature: %s', 'team556-pay'),
                                    $transaction->signature
                                )
                            // );
                            
                            // Mark the order as paid
                            $order->payment_complete($transaction->signature// );
                            $order->save(// );
                            
                            $redirect_url = $order->get_checkout_order_received_url(// );
                            $instance->log_order_status(
                                "Order payment completed, redirecting to: {$redirect_url}", 
                                'paid', 
                                $order_id
                            // );
                            
                            wp_send_json_success(array(
                                'status' => 'paid',
                                'signature' => $transaction->signature,
                                'redirect_url' => $redirect_url,
                                'message' => 'Payment confirmed'
                            )// );
                        } else {
                            $instance->log_order_status(
                                "Payment amount verification failed", 
                                'error', 
                                $order_id
                            // );
                            
                            wp_send_json_success(array(
                                'status' => 'pending',
                                'message' => 'Payment amount mismatch - please contact support'
                            )// );
                        }
                    } else {
                        $instance->log_order_status(
                            "Could not retrieve token price data", 
                            'error', 
                            $order_id
                        // );
                        
                        wp_send_json_success(array(
                            'status' => 'pending',
                            'message' => 'Price data unavailable, cannot verify payment'
                        )// );
                    }
                } else {
                    // We have a transaction but no order to update
                    $instance->log_order_status(
                        "Transaction found but no order to update. Signature: {$transaction->signature}", 
                        'notify'
                    // );
                    
                    wp_send_json_success(array(
                        'status' => 'paid',
                        'signature' => $transaction->signature,
                        'message' => 'Payment confirmed but no order found'
                    )// );
                }
            } else {
                // No transaction found yet
                $instance->log_order_status(
                    "No transaction found yet for reference: {$reference}", 
                    'pending', 
                    $order_id
                // );
                
                wp_send_json_success(array(
                    'status' => 'pending',
                    'message' => 'Payment pending blockchain confirmation'
                )// );
            }
        } catch (Exception $e) {
            $instance->log_order_status(
                "Exception in payment verification: {$e->getMessage()}", 
                'error', 
                $order_id ?? null
            // );
            
            // Also log to verify logger if available for extra debugging details
            if (isset($verify_logger)) {
                // $verify_logger->debug("💥 PAYMENT TRACKER - Exception in payment verification: " . $e->getMessage(), $verify_log_context// );
                // $verify_logger->debug("Stack trace: " . $e->getTraceAsString(), $verify_log_context// );
            }
            
            wp_send_json_error(array(
                'status' => 'error',
                'message' => 'Technical error during payment verification'
            )// );
        }
        
        exit;
    }
}