<?php
/**
 * Main plugin class
 */
class Team556_Pay {
    /**
     * Plugin instance
     */
    private static $instance;

    /**
     * Constructor
     */
    public function __construct() {
        // Singleton pattern
        if (isset(self::$instance)) {
            return self::$instance;
        }
        self::$instance = $this;
    }

    /**
     * Initialize the plugin
     */
    public function init() {
        // Add hooks
        add_action('init', array($this, 'register_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'), 90); // Run a bit later
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Add WooCommerce payment gateway if WooCommerce is active
        if ($this->is_woocommerce_active()) {
            add_filter('woocommerce_payment_gateways', array($this, 'add_pay_gateway'));
            require_once TEAM556_PAY_PLUGIN_DIR . 'includes/class-team556-pay-gateway.php';
        }
        
        // Add shortcode
        add_shortcode('team556_pay', array($this, 'payment_shortcode'));
        
        // Add AJAX handler for verifying transactions
        add_action('wp_ajax_team556_verify_transaction', array($this, 'ajax_verify_transaction'));
        add_action('wp_ajax_nopriv_team556_verify_transaction', array($this, 'ajax_verify_transaction'));
        
        // Add AJAX handler for checking payment status
        add_action('wp_ajax_team556_check_payment_status', array($this, 'ajax_check_payment_status'));
        add_action('wp_ajax_nopriv_team556_check_payment_status', array($this, 'ajax_check_payment_status'));
    }

    /**
     * Register scripts
     */
    public function register_scripts() {
        error_log('[Team556_Pay] register_scripts called.');
        // Register Solana Pay scripts
        wp_register_script(
            'team556-solana-web3',
            'https://unpkg.com/@solana/web3.js@1.73.0/lib/index.iife.min.js',
            array(),
            TEAM556_PAY_VERSION,
            true
        );
        
        // Register Buffer polyfill for browser compatibility (inline only)
        wp_register_script(
            'team556-buffer',
            '', // Empty URL - just for inline script
            array(),
            '1.0.0',
            true
        );
        
        // Add inline script to create Buffer global for browser compatibility
        wp_add_inline_script(
            'team556-buffer',
            '
            // Browser-compatible Buffer polyfill
            if (typeof window !== "undefined" && !window.Buffer) {
                window.Buffer = {
                    alloc: function(size) {
                        return new Uint8Array(size);
                    },
                    from: function(data) {
                        if (Array.isArray(data)) {
                            return new Uint8Array(data);
                        }
                        if (typeof data === "string") {
                            return new TextEncoder().encode(data);
                        }
                        return new Uint8Array(data);
                    }
                };
            }
            ',
            'after'
        );
        
        // Register QR Code library
        wp_register_script(
            'team556-qrcode',
            'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js',
            array(),
            '1.5.1',
            true
        );

        // Register our custom script
        wp_register_script(
            'team556-pay',
            TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-pay.js',
            array('jquery', 'team556-buffer', 'team556-solana-web3', 'team556-qrcode'),
            TEAM556_PAY_VERSION,
            true
        );

        // Register styles
        wp_register_style(
            'team556-pay-style',
            TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-pay.css',
            array(),
            TEAM556_PAY_VERSION
        );
    }

    /**
     * Enqueue frontend scripts
     */
    public function enqueue_frontend_scripts() {
	    $is_checkout = function_exists('is_checkout') && is_checkout();
	    $is_order_pay_page = function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-pay');
	    $is_shortcode_present = $this->is_team556_pay_shortcode_present();
	    $is_cart = function_exists('is_cart') && is_cart();
	    $checkout_page_id = function_exists('wc_get_page_id') ? wc_get_page_id('checkout') : 0;
	    $current_page_id = get_queried_object_id(); // More reliable inside wp_enqueue_scripts
	    $is_checkout_page_by_id = ($checkout_page_id && $current_page_id && $current_page_id == $checkout_page_id);
	    // $is_checkout_page_by_is_page = function_exists('wc_get_page_id') && is_page(wc_get_page_id('checkout')); // Alternative, often less reliable during AJAX

	    error_log('[Team556_Pay] enqueue_frontend_scripts called. Priority 90.');
	    error_log('[Team556_Pay] Current Page ID (get_queried_object_id): ' . $current_page_id);
	    error_log('[Team556_Pay] Checkout Page ID (wc_get_page_id): ' . $checkout_page_id);
	    error_log('[Team556_Pay] is_checkout_page_by_id (current_page_id == checkout_page_id): ' . ($is_checkout_page_by_id ? 'true' : 'false'));
	    error_log('[Team556_Pay] is_checkout(): ' . ($is_checkout ? 'true' : 'false'));
	    error_log('[Team556_Pay] is_wc_endpoint_url(\'order-pay\'): ' . ($is_order_pay_page ? 'true' : 'false'));
	    error_log('[Team556_Pay] is_team556_pay_shortcode_present(): ' . ($is_shortcode_present ? 'true' : 'false'));
	    error_log('[Team556_Pay] is_cart(): ' . ($is_cart ? 'true' : 'false'));
	    // error_log('[Team556_Pay] is_page(wc_get_page_id(\'checkout\')) (is_page_check): ' . (function_exists('wc_get_page_id') && is_page(wc_get_page_id('checkout')) ? 'true' : 'false'));

	    $should_enqueue = false;

	    if ($is_checkout_page_by_id) {
	        $should_enqueue = true;
	        error_log('[Team556_Pay] Matched by current_page_id == checkout_page_id.');
	    } elseif ($is_shortcode_present) {
	        $should_enqueue = true;
	        error_log('[Team556_Pay] Matched by shortcode_present.');
	    } elseif ($is_checkout) { // Fallback to is_checkout
	        $should_enqueue = true;
	        error_log('[Team556_Pay] Matched by is_checkout (fallback).');
	    } elseif ($is_order_pay_page) { // Fallback to order-pay page
	        $should_enqueue = true;
	        error_log('[Team556_Pay] Matched by is_order_pay_page (fallback).');
	    }
	    // Not including $is_cart as it's usually too broad for payment gateway specific scripts.

	    if ($should_enqueue) {
	        error_log('[Team556_Pay] Conditions met, enqueuing scripts in enqueue_frontend_scripts...');
	        wp_enqueue_script('team556-buffer');
	        wp_enqueue_script('team556-solana-web3');
	        wp_enqueue_script('team556-qrcode'); // Added qrcode
	        wp_enqueue_script('team556-pay');
	        wp_enqueue_style('team556-pay-style');
	        
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
	        ));
	        
	    } else {
	        error_log('[Team556_Pay] Exiting enqueue_frontend_scripts - no relevant page or shortcode identified.');
	    }
	}

    /**
     * Check if the [team556_pay] shortcode is present on the current page/post.
     *
     * @return bool True if the shortcode is found, false otherwise.
     */
    private function is_team556_pay_shortcode_present() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'team556_pay')) {
            return true;
        }
        // Fallback for situations where $post might not be fully populated yet,
        // or if used in contexts like widgets or theme parts not directly tied to a single post object.
        // This is a broader check and might be less performant if used excessively.
        if (function_exists('get_the_content')) {
            $content = get_the_content();
            if (has_shortcode($content, 'team556_pay')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('team556-pay/v1', '/verify-payment', array(
            'methods' => 'POST',
            'callback' => array($this, 'verify_payment'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * AJAX handler for verifying transactions
     */
    public function ajax_verify_transaction() {
        // Check nonce
        check_ajax_referer('team556-pay-nonce', 'nonce');
        
        // Get parameters
        $signature = isset($_POST['signature']) ? sanitize_text_field($_POST['signature']) : '';
        $amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        
        // Verify the transaction
        $verified = $this->verify_transaction_on_blockchain($signature, $amount);
        
        if (!$verified) {
            wp_send_json_error(array('message' => 'Transaction verification failed'));
            exit;
        }
        
        // If this is a WooCommerce order, update its status
        if ($order_id && $this->is_woocommerce_active()) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order->payment_complete();
                $order->add_order_note(
                    sprintf(
                        __('Payment completed via Solana Pay. Transaction signature: %s', 'team556-pay'),
                        $signature
                    )
                );
                
                // Store the transaction signature in order meta
                $order->update_meta_data('_team556_solana_pay_signature', $signature);
                $order->save();
            }
        }
        
        // Log the transaction in our database
        $this->log_transaction($signature, $amount, $order_id);
        
        // Return success
        wp_send_json_success(array(
            'message' => 'Transaction verified successfully',
            'redirect' => $order_id ? $order->get_checkout_order_received_url() : ''
        ));
        exit;
    }

    /**
     * Verify payment endpoint
     */
    public function verify_payment($request) {
        // Get parameters
        $params = $request->get_params();
        $signature = isset($params['signature']) ? sanitize_text_field($params['signature']) : '';
        $amount = isset($params['amount']) ? floatval($params['amount']) : 0;
        $order_id = isset($params['order_id']) ? intval($params['order_id']) : 0;
        
        // Verify the transaction on Solana blockchain
        $verified = $this->verify_transaction_on_blockchain($signature, $amount);
        
        if (!$verified) {
            return rest_ensure_response(array(
                'success' => false,
                'message' => 'Transaction verification failed',
            ));
        }
        
        // If this is a WooCommerce order, update its status
        if ($order_id && $this->is_woocommerce_active()) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order->payment_complete();
                $order->add_order_note(
                    sprintf(
                        __('Payment completed via Solana Pay. Transaction signature: %s', 'team556-pay'),
                        $signature
                    )
                );
                
                // Store the transaction signature in order meta
                $order->update_meta_data('_team556_solana_pay_signature', $signature);
                $order->save();
            }
        }
        
        // Log the transaction in our database
        $this->log_transaction($signature, $amount, $order_id);
        
        // Return success response
        $response = array(
            'success' => true,
            'message' => 'Payment verified successfully',
        );
        
        // Add redirect URL if this is a WooCommerce order
        if ($order_id && isset($order)) {
            $response['redirect'] = $order->get_checkout_order_received_url();
        }
        
        return rest_ensure_response($response);
    }
    
    /**
     * Verify transaction on blockchain
     */
    public function verify_transaction_on_blockchain($signature, $amount) {
        // Get merchant wallet address
        $wallet_address = get_option('team556_solana_pay_wallet_address', '');
        
        if (empty($wallet_address)) {
            return false;
        }
        
        // Get network
        $network = get_option('team556_solana_pay_network', 'mainnet');
        
        // Initialize verifier
        $debug_mode = get_option('team556_solana_pay_debug_mode', '0') === '1';
        $verifier = new Team556_Solana_Pay_Verifier($debug_mode);
        
        // Verify transaction
        return $verifier->verify_transaction(
            $signature,
            $wallet_address,
            $amount,
            $network
        );
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
        $db = new Team556_Pay_DB();
        
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
        ));
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
        ), $atts);
        
        // Enqueue scripts
        wp_enqueue_script('team556-buffer');
        wp_enqueue_script('team556-solana-web3');
        wp_enqueue_script('team556-pay');
        wp_enqueue_style('team556-pay-style');
        
        // Get button color from settings
        $button_color = get_option('team556_solana_pay_button_color', '#9945FF');
        
        ob_start();
        ?>
        <div class="team556-pay-container" 
            data-amount="<?php echo esc_attr($atts['amount']); ?>" 
            data-description="<?php echo esc_attr($atts['description']); ?>" 
            data-success-url="<?php echo esc_url($atts['success_url']); ?>" 
            data-cancel-url="<?php echo esc_url($atts['cancel_url']); ?>">
            
            <button class="team556-pay-button" style="background-color: <?php echo esc_attr($button_color); ?>">
                <?php echo esc_html($atts['button_text']); ?>
            </button>
            
            <div class="team556-pay-status"></div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Check if WooCommerce is active
     */
    private function is_woocommerce_active() {
        return in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')));
    }

    /**
     * AJAX handler for checking payment status
     */
    public function ajax_check_payment_status() {
        // Verify nonce
        check_ajax_referer('team556-pay-check-payment', 'nonce');
        
        // Get reference
        $reference = isset($_POST['reference']) ? sanitize_text_field($_POST['reference']) : '';
        
        if (empty($reference)) {
            wp_send_json_error(array('message' => 'Missing reference'));
            exit;
        }
        
        // Initialize the Solana Pay verifier
        $verifier = new Team556_Solana_Pay_Verifier();
        
        // Check if the transaction exists for this reference
        $transaction = $verifier->check_transaction_by_reference($reference);
        
        if ($transaction) {
            // Payment found, return success response
            wp_send_json_success(array(
                'status' => 'paid',
                'signature' => $transaction->signature,
                'message' => 'Payment confirmed'
            ));
        } else {
            // Payment not found yet, continue polling
            wp_send_json_success(array(
                'status' => 'pending',
                'message' => 'Payment pending'
            ));
        }
        
        exit;
    }
} 