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
        $this->id                 = 'team556_pay';
        $this->icon               = TEAM556_PAY_PLUGIN_URL . 'assets/images/logo-round-dark.png';
        $this->has_fields         = true;
        $this->method_title       = __('Team556 Pay', 'team556-pay');
        $this->method_description = __('Accept Team556 token payments via Team556 Pay', 'team556-pay');
        $this->supports           = array('products');

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
        add_action('woocommerce_api_team556_pay_callback', array($this, 'check_payment'));
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
        add_action('wp_enqueue_scripts', array($this, 'payment_scripts'));
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
                'default' => __('Pay with Team556 tokens via Team556 Pay. You will need a Solana wallet with Team556 tokens.', 'team556-pay'),
            ),
            'wallet_address' => array(
                'title' => __('Merchant Wallet Address', 'team556-pay'),
                'type' => 'text',
                'description' => __('Enter your Solana wallet address to receive payments. If left empty, the global setting will be used.', 'team556-pay'),
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
        // Only on checkout page
        if (!is_checkout()) {
            return;
        }
        
        // If gateway is disabled, don't load scripts
        if ($this->enabled !== 'yes') {
            return;
        }
        
        // Enqueue Solana Pay scripts
        wp_enqueue_script('team556-solana-web3');
        wp_enqueue_script('team556-buffer');
        wp_enqueue_script('team556-qrcode');
        wp_enqueue_script('team556-pay');
        wp_enqueue_style('team556-pay-style');

            // Add gateway-specific data
            wp_localize_script('team556-pay', 'team556PayGateway', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'completePaymentNonce' => wp_create_nonce('team556-pay-complete-payment'),
                'merchantWallet' => $this->wallet_address,
                'checkoutUrl' => $this->get_return_url(null), // We'll replace this with the actual order URL after payment
                'debugMode' => $this->debug_mode === 'yes',
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
        $order->update_meta_data('_team556_solana_pay_signature', $signature);
        $order->save();
        
        if ($this->debug_mode === 'yes') {
            $this->log("Payment completed for order #$order_id");
        }
        
        // Clear session data
        WC()->session->__unset('team556_solana_pay_order_id');
        
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
        $order->update_meta_data('_team556_solana_pay_signature', $signature);
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
        // Get order total from cart or order
        $order_total = 0;
        if (is_checkout()) {
            $order_total = WC()->cart->get_total('edit');
        } elseif (is_wc_endpoint_url('order-pay')) {
            $order_id = absint(get_query_var('order-pay'));
            $order = wc_get_order($order_id);
            if ($order) {
                $order_total = $order->get_total();
            }
        }

        if ($order_total <= 0) {
            echo '<p>' . __('Invalid order amount.', 'team556-pay') . '</p>';
            return;
        }

        // Fetch real-time price data
        $price_data = $this->fetch_team556_price_data();

        if (false === $price_data || !isset($price_data['price']) || $price_data['price'] <= 0) {
            $error_message = isset($price_data['error']) ? esc_html($price_data['error']) : __('Could not retrieve the current TEAM556 exchange rate. This payment method is temporarily unavailable. Please try refreshing or contact support.', 'team556-pay');
            echo '<div class="woocommerce-error">' . $error_message . '</div>';
            // Log the error if in debug mode
            if (isset($price_data['error'])) {
                $this->log('Price fetch error: ' . $price_data['error']);
            } else {
                $this->log('Price fetch error: Price data was false or price was not positive.');
            }
            return; // Do not render the rest of the payment form
        }

        $team556_price_usdc = $price_data['price']; // Price of 1 TEAM556 in USDC
        $last_updated_timestamp = $price_data['last_updated'];

        // Calculate Team556 token amount based on real-time price
        // Ensure $team556_price_usdc is not zero to prevent division by zero
        if ($team556_price_usdc <= 0) {
             echo '<div class="woocommerce-error">' . __('Invalid exchange rate received. Cannot calculate payment amount.', 'team556-pay') . '</div>';
            $this->log('Price fetch error: team556_price_usdc was not positive after fetch.');
            return;
        }
        $team556_amount = $order_total / $team556_price_usdc;
        
        // Ensure we always have at least a minimal amount if calculation results in zero or less (e.g. very small order_total)
        if ($team556_amount <= 0) {
            // This case should ideally be handled by minimum order value, but as a failsafe:
            $team556_amount = 0.000001; // A very small token amount
            // $order_total would need recalculation if we were to enforce this minimum token amount back to fiat.
            // For simplicity, we just ensure a tiny token amount to prevent issues with Solana Pay URL if order_total is extremely small.
        }
        
        // Format for display (consider token's actual decimal precision)
        // Solana SPL tokens can have up to 9 decimal places. Let's use a reasonable number like 6 for display and calculation.
        $team556_amount_formatted = number_format($team556_amount, 6, '.', '');
        
        // Generate unique identifier for this potential order
        $reference = preg_replace('/[^a-zA-Z0-9]/', '', uniqid());

        // Create Solana Pay URL with the correct wallet address and calculated TOKEN amount
        $solana_pay_url = $this->create_solana_pay_url($team556_amount, $reference); // Pass TOKEN amount
        
        // Display payment form with QR code
        ?>
        <div id="team556-pay-form" class="team556-adaptive">
            <div class="team556-payment-summary">
                <div class="team556-payment-row">
                    <span><?php _e('Order Total:', 'team556-pay'); ?></span>
                    <strong><?php echo wc_price($order_total); ?></strong>
                </div>
                <div class="team556-payment-row team556-token-amount">
                    <span><?php _e('Team556 Amount:', 'team556-pay'); ?></span>
                    <strong><span id="team556-token-amount"><?php echo esc_html($team556_amount_formatted); ?></span> TEAM556</strong>
                </div>
                <div class="team556-payment-row team556-conversion-rate">
                    <span><?php _e('Conversion Rate:', 'team556-pay'); ?></span>
                    <span>1 TEAM556 = <?php echo wc_price($team556_price_usdc); ?> (USDC)</span>
                    <button type="button" id="team556-refresh-rate" class="team556-refresh-button" title="<?php esc_attr_e('Refresh conversion rate', 'team556-pay'); ?>">
                        <span class="dashicons dashicons-update"></span>
                    </button>
                </div>
                 <div class="team556-payment-row team556-rate-info">
                    <small><?php printf(__('Rate as of: %s. Updated every 10 seconds.', 'team556-pay'), esc_html(wp_date(get_option('date_format') . ' ' . get_option('time_format'), $last_updated_timestamp))); ?></small>
                </div>
            </div>
            
            <p class="team556-scan-title"><?php _e('Scan this QR code with your Solana wallet app to pay with Team556 tokens:', 'team556-pay'); ?></p>
            
            <div id="team556-qr-code-container" class="team556-qr-code-container">
                <!-- QR code will be generated here by JavaScript -->
            </div>
            <div id="team556-payment-link-container" class="team556-payment-link-container" style="margin-top: 15px; text-align: center;">
                <p style="margin-bottom: 5px; font-size: 0.9em;"><?php _e('Or copy this link to pay:', 'team556-pay'); ?></p>
                <input type="text" id="team556-payment-link" value="<?php echo esc_attr($solana_pay_url); ?>" readonly style="width: 80%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em; text-align: center; background-color: #f9f9f9;">
                <button type="button" id="team556-copy-link-button" class="button" style="padding: 8px 15px; font-size: 0.9em;">
                    <?php _e('Copy Link', 'team556-pay'); ?>
                </button>
            </div>
            
            <ul class="team556-wallet-steps">
                <li class="team556-wallet-step"><?php _e('1. Open your Solana wallet app', 'team556-pay'); ?></li>
                <li class="team556-wallet-step"><?php _e('2. Scan the QR code above', 'team556-pay'); ?></li>
                <li class="team556-wallet-step"><?php _e('3. Approve the payment of <strong id="team556-token-amount-instructions">' . esc_html($team556_amount_formatted) . '</strong> TEAM556 tokens', 'team556-pay'); ?></li>
                <li class="team556-wallet-step"><?php _e('4. Wait for confirmation and proceed to complete your order', 'team556-pay'); ?></li>
            </ul>
            
            <input type="hidden" name="team556_reference" id="team556_reference" value="<?php echo esc_attr($reference); ?>">
            <input type="hidden" name="team556_signature" id="team556_signature" value="">
            <input type="hidden" name="team556_wallet_address" id="team556_wallet_address" value="<?php echo esc_attr($this->wallet_address); ?>">
            
            <div class="team556-pay-status"></div>
        </div>
        
        <style>
            /* Team556 Merchant Styling - Based on team556-pay.css */
            :root {
                --solana-dark: #14151A;
                --solana-dark-lighter: #1C1D24;
                --solana-purple: #9945FF;
                --solana-blue: #14F195;
                --solana-green: #00FFA3;
                --solana-magenta: #FF5C5C;
                --glass-border: rgba(255, 255, 255, 0.08);
                --glass-bg: rgba(20, 21, 26, 0.7);
                --text-white: #FFFFFF;
                --text-gray: #A3A3A3;
            }
            
            /* Overall form styling */
            #team556-pay-form {
                background-color: var(--solana-dark);
                border-radius: 12px;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                color: var(--text-white);
                max-width: 100%;
                margin-bottom: 30px;
                border: 1px solid var(--glass-border);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }
            
            /* Payment summary area */
            .team556-payment-summary {
                background-color: var(--solana-dark-lighter);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                border: 1px solid var(--glass-border);
            }
            
            .team556-payment-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .team556-payment-row:last-child {
                border-bottom: none;
            }
            
            .team556-payment-row span {
                color: var(--text-white);
                font-weight: 500;
            }
            
            .team556-payment-row strong {
                color: var(--text-white);
                font-weight: 600;
            }
            
            .team556-token-amount strong {
                color: var(--solana-green) !important;
            }
            
            /* The refresh button */
            .team556-refresh-button {
                background-color: var(--solana-purple) !important;
                border: none !important;
                color: white !important;
                width: 30px;
                height: 30px;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                padding: 0 !important;
                margin-left: 10px !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 0 15px rgba(153, 69, 255, 0.3) !important;
            }
            
            .team556-refresh-button:hover {
                opacity: 0.9 !important;
                transform: translateY(-1px) !important;
            }
            
            .team556-refresh-button .dashicons {
                width: 16px;
                height: 16px;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .team556-refresh-spin {
                animation: team556-spin 1s linear infinite;
            }
            
            @keyframes team556-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Scan QR code title */
            .team556-scan-title {
                color: var(--text-white);
                text-align: left;
                font-weight: 500;
                margin: 15px 0;
            }
            
            /* QR code container */
            .team556-qr-code-container {
                background-color: white;
                border-radius: 12px;
                padding: 20px;
                width: 100%;
                max-width: 260px;
                margin: 0 auto 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                position: relative;
            }
            
            #team556-qr-code-container canvas {
                display: block;
                margin: 0 auto;
                max-width: 100%;
                height: auto !important;
            }
            
            /* Payment link container */
            .team556-payment-link-container {
                margin-top: 15px;
                text-align: center;
            }
            
            #team556-payment-link {
                width: 80%;
                padding: 8px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9em;
                text-align: center;
                background-color: #f9f9f9;
            }
            
            #team556-copy-link-button {
                padding: 8px 15px;
                font-size: 0.9em;
            }
            
            /* Wallet steps */
            .team556-wallet-steps {
                list-style: none;
                padding: 0;
                margin: 20px 0 0;
            }
            
            .team556-wallet-step {
                position: relative;
                padding-left: 36px;
                margin-bottom: 12px;
                line-height: 1.5;
                font-size: 14px;
                color: var(--text-white);
            }
            
            .team556-wallet-step::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background-color: var(--solana-purple);
                border-radius: 1.5px;
            }
            
            .team556-wallet-step strong {
                color: var(--solana-green);
                font-weight: 600;
            }
            
            /* Status messages */
            .team556-pay-status {
                margin-top: 20px;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-weight: 500;
                display: none;
                background-color: var(--solana-dark-lighter);
                border: 1px solid var(--glass-border);
            }
            
            .team556-pay-status[data-status="error"] {
                display: block;
                border-left: 4px solid var(--solana-magenta);
                color: var(--solana-magenta);
            }
            
            .team556-pay-status[data-status="success"] {
                display: block;
                border-left: 4px solid var(--solana-green);
                color: var(--solana-green);
            }
            
            .team556-pay-status[data-status="processing"] {
                display: block;
                border-left: 4px solid var(--solana-blue);
                color: var(--solana-blue);
            }
            
            /* Responsive styles */
            @media (max-width: 480px) {
                .team556-qr-code-container {
                    padding: 15px;
                }
                
                #team556-qr-code-container canvas {
                    height: 180px;
                }
                
                .team556-payment-row span,
                .team556-payment-row strong {
                    font-size: 14px;
                }
            }
        </style>
        
        <script type="text/javascript">
            jQuery(function($) {
                // Initialize amount in instructions
                $('#team556-token-amount-instructions').text($('#team556-token-amount').text());
                
                // Generate QR code when page loads
                var solanaPayUrl = '<?php echo esc_js($solana_pay_url); ?>';
                console.log('Solana Pay URL (from PHP for main script):', solanaPayUrl); // Debug line updated for clarity
                
                var reference = $('#team556_reference').val();
                
                // Fallback QR code generator using HTML
                function generateQRCodeFallback(url, containerId) {
                    var container = document.getElementById(containerId.replace('#', ''));
                    if (!container) return false;
                    
                    // Create a simple text fallback
                    container.innerHTML = '<div style="padding: 20px; text-align: center;">' +
                        '<p style="margin-bottom: 10px; color: #14151A;"><strong>Scan with your Solana wallet app:</strong></p>' +
                        '<textarea readonly style="width: 100%; height: 80px; padding: 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">' + 
                        url + '</textarea>' +
                        '<p style="margin-top: 10px; font-size: 12px; color: #14151A;">The QR code couldn\'t be generated. Copy this URL to your wallet app.</p>' +
                        '</div>';
                    
                    // Hide spinner
                    $('.team556-qrcode-spinner').hide();
                    return true;
                }
                
                // Function to generate QR code using a more reliable method
                function generateQRCode(url, containerId) {
                    if (typeof QRCode === 'undefined') {
                        console.error('QR code library not loaded');
                        $('.team556-pay-status').html('<?php _e('QR code library not loaded. Please refresh the page.', 'team556-pay'); ?>').attr('data-status', 'error');
                        $('.team556-qrcode-spinner').hide();
                        // Try the fallback
                        return generateQRCodeFallback(url, containerId);
                    }
                    
                    try {
                        // Get the container element
                        var container = document.getElementById(containerId.replace('#', ''));
                        if (!container) {
                            console.error('QR code container not found:', containerId);
                            return false;
                        }
                        
                        // Clear the container first
                        container.innerHTML = '';
                        
                        // Check which QRCode API we have available
                        if (typeof QRCode === 'function') {
                            // Standard QRCode library
                            var qr = new QRCode(container, {
                                text: url,
                                width: 220,
                                height: 220,
                                colorDark: "#14151A",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 3 // Use H level (3) if available
                            });
                        } else if (QRCode && typeof QRCode.toCanvas === 'function') {
                            // qrcode.js library with Canvas API
                            var canvas = document.createElement('canvas');
                            container.appendChild(canvas);
                            QRCode.toCanvas(canvas, url, {
                                width: 220,
                                margin: 1,
                                color: {
                                    dark: '#14151A',
                                    light: '#FFFFFF'
                                }
                            }, function(error) {
                                if (error) throw error;
                            });
                        } else if (QRCode && typeof QRCode.toString === 'function') {
                            // qrcode.js with toString API
                            var svg = QRCode.toString(url, {
                                type: 'svg',
                                width: 220,
                                margin: 1,
                                color: {
                                    dark: '#14151A',
                                    light: '#FFFFFF'
                                }
                            });
                            container.innerHTML = svg;
                        } else {
                            console.error('No compatible QRCode method found');
                            return generateQRCodeFallback(url, containerId);
                        }
                        
                        // Hide spinner once QR code is generated
                        $('.team556-qrcode-spinner').hide();
                        return true;
                    } catch (error) {
                        console.error('Exception in QR code generation:', error);
                        $('.team556-pay-status').html('<?php _e('Error generating QR code. Using text URL instead.', 'team556-pay'); ?>').attr('data-status', 'error');
                        // Try the fallback
                        return generateQRCodeFallback(url, containerId);
                    }
                }
                
                // Load QR Code library if not present
                function loadQRCodeLibrary(callback) {
                    if (typeof QRCode !== 'undefined') {
                        callback();
                        return;
                    }
                    
                    // Load the simplest QR code library (davidshimjs/qrcodejs)
                    var script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js';
                    script.onload = function() {
                        if (typeof QRCode !== 'undefined') {
                            callback();
                        } else {
                            // If still not defined, try alternative
                            var altScript = document.createElement('script');
                            altScript.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
                            altScript.onload = callback;
                            altScript.onerror = function() {
                                // If all QR libraries fail, use a fallback
                                callback();
                            };
                            document.head.appendChild(altScript);
                        }
                    };
                    script.onerror = function() {
                        // If the first QR library fails, try the alternative immediately
                        var altScript = document.createElement('script');
                        altScript.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
                        altScript.onload = callback;
                        altScript.onerror = function() {
                            // If all QR libraries fail, use a fallback
                            callback();
                        };
                        document.head.appendChild(altScript);
                    };
                    document.head.appendChild(script);
                }
                
                // Generate QR code and start payment check
                function initializePayment() {
                    // Generate QR code
                    if (generateQRCode(solanaPayUrl, 'team556-qr-code-container')) {
                        // Start checking for payment status
                        checkPaymentStatus(reference);
                    }
                }
                
                // Load QR Code library if needed and initialize payment
                loadQRCodeLibrary(initializePayment);
                
                // Handle refresh button click
                $('#team556-refresh-rate').on('click', function(e) {
                    e.preventDefault();
                    
                    // Add spin animation to the refresh icon
                    $(this).find('.dashicons').addClass('team556-refresh-spin');
                    
                    // Get current order total
                    var orderTotal = parseFloat("<?php echo $order_total; ?>");
                    if (isNaN(orderTotal) || orderTotal <= 0) {
                        orderTotal = 0.01; // Minimum for testing
                    }
                    
                    // Use fixed conversion rate (3.5 TEAM556 per $1)
                    var conversionRate = 3.5;
                    
                    // Calculate new token amount
                    var tokenAmount = orderTotal * conversionRate;
                    var tokenAmountFormatted = tokenAmount.toFixed(2);
                    
                    // Update the displayed token amount
                    $('#team556-token-amount').text(tokenAmountFormatted);
                    $('#team556-token-amount-instructions').text(tokenAmountFormatted);
                    
                    // Regenerate QR code with updated amount
                    regenerateQRCode(orderTotal, tokenAmount);
                    
                    // Remove spin animation after short delay
                    setTimeout(function() {
                        $('#team556-refresh-rate').find('.dashicons').removeClass('team556-refresh-spin');
                    }, 1000);
                });
                
                // Function to regenerate QR code with new amount
                function regenerateQRCode(orderTotal, tokenAmount) {
                    // Show spinner
                    $('.team556-qrcode-spinner').show();
                    
                    // Get wallet address and reference
                    var walletAddress = "<?php echo esc_js($this->wallet_address); ?>";
                    var reference = $('#team556_reference').val();
                    
                    // Create new Solana Pay URL with updated amount
                    var tokenMint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5'; // Corrected Team556 Token Mint
                    var shopName = "<?php echo esc_js(get_bloginfo('name')); ?>";
                    
                    // Format token amount
                    var tokenAmountStr = tokenAmount.toFixed(2);
                    
                    // Build the Solana Pay URL
                    var solanaPayUrl = 'solana:' + walletAddress + 
                                      '?spl-token=' + tokenMint + 
                                      '&amount=' + tokenAmountStr +
                                      '&label=' + encodeURIComponent(shopName) +
                                      '&message=' + encodeURIComponent('Payment for order at ' + shopName);
                    
                    // Update hidden field
                    $('#team556_solana_pay_url').val(solanaPayUrl);
                    
                    // Generate new QR code
                    generateQRCode(solanaPayUrl, 'team556-qr-code-container');
                }
                
                // Function to check payment status
                function checkPaymentStatus(reference) {
                    // Capture nonce from PHP to avoid issues
                    var securityNonce = '<?php echo wp_create_nonce('team556-pay-check-payment'); ?>';
                    
                    var checkInterval = setInterval(function() {
                        $.ajax({
                            url: wc_checkout_params ? wc_checkout_params.ajax_url : '<?php echo admin_url('admin-ajax.php'); ?>',
                            type: 'POST',
                            data: {
                                action: 'team556_solana_pay_check_payment',
                                reference: reference,
                                security: securityNonce
                            },
                            success: function(response) {
                                if (response && response.success && response.data && response.data.signature) {
                                    // Payment found
                                    clearInterval(checkInterval);
                                    
                                    // Update status and store signature
                                    $('.team556-pay-status').html('<?php _e('Payment detected! Processing...', 'team556-pay'); ?>').attr('data-status', 'success');
                                    $('#team556_signature').val(response.data.signature);
                                    
                                    // Submit payment form
                                    setTimeout(function() {
                                        $('form.checkout').submit();
                                    }, 2000);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.log('Error checking payment status:', error);
                            }
                        });
                    }, 5000); // Check every 5 seconds
                }
                
                // Copy link button functionality
                $('#team556-copy-link-button').on('click', function() {
                    var paymentLinkInput = document.getElementById('team556-payment-link');
                    paymentLinkInput.select();
                    paymentLinkInput.setSelectionRange(0, 99999); // For mobile devices

                    try {
                        var successful = document.execCommand('copy');
                        var msg = successful ? '<?php _e("Copied!", "team556-pay"); ?>' : '<?php _e("Copy failed", "team556-pay"); ?>';
                        $(this).text(msg);
                    } catch (err) {
                        $(this).text('<?php _e("Oops, unable to copy", "team556-pay"); ?>');
                    }

                    setTimeout(function() {
                        $('#team556-copy-link-button').text('<?php _e("Copy Link", "team556-pay"); ?>');
                    }, 2000);
                });
                
                // Clean up interval when page unloads
                $(window).on('beforeunload', function() {
                    if (typeof checkInterval !== 'undefined') {
                        clearInterval(checkInterval);
                    }
                });
            });
        </script>
        <?php
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
     * Add CSS to ensure payment method is visible on all themes
     */
    public function add_payment_method_styles() {
        if (!is_checkout()) {
            return;
        }
        ?>
        <style type="text/css">
            /* Payment method selection - ensure visibility */
            .wc_payment_method label[for="payment_method_team556_solana_pay"] {
                color: #14151A !important;
                font-weight: 500;
                position: relative;
            }
            
            /* Style the radio label when selected */
            .wc_payment_method.payment_method_team556_solana_pay.active label,
            .wc_payment_method.payment_method_team556_solana_pay input:checked + label {
                color: #9945FF !important;
                font-weight: 600;
            }
            
            /* Ensure payment gateway icon has good spacing */
            .wc_payment_method.payment_method_team556_solana_pay img {
                margin-left: 8px;
                vertical-align: middle;
                max-height: 28px;
                width: auto;
                display: inline-block;
            }
            
            /* Description of payment method */
            .payment_box.payment_method_team556_solana_pay p {
                color: #505050 !important;
            }
            
            /* Fix double checkbox issue by hiding the duplicate checkbox */
            .wc_payment_method.payment_method_team556_solana_pay input[type="checkbox"] {
                display: none !important;
            }
            
            /* Hide any duplicate checkbox in payment gateway container */
            label[for="payment_method_team556_solana_pay"] input[type="checkbox"],
            #payment ul.payment_methods li.payment_method_team556_solana_pay input[type="checkbox"] {
                display: none !important;
            }
            
            /* Fix for themes that add additional inputs */
            .payment_method_team556_solana_pay label::before,
            .payment_method_team556_solana_pay label::after {
                display: none !important;
            }
            
            /* Additional styling for dark mode themes */
            body.dark-mode .wc_payment_method.payment_method_team556_solana_pay label,
            .theme-dark .wc_payment_method.payment_method_team556_solana_pay label,
            .dark-theme .wc_payment_method.payment_method_team556_solana_pay label,
            .dark .wc_payment_method.payment_method_team556_solana_pay label {
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