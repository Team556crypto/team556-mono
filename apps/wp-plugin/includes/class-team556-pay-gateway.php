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
     * Merchant wallet address
     * @var string
     */
    public $wallet_address = '';

    /**
     * Debug mode setting
     * @var string
     */
    public $debug_mode = 'no';

    /**
     * Solana network setting
     * @var string
     */
    public $network = 'mainnet';

    /**
     * Logger instance
     * @var WC_Logger
     */
    private $logger;

    /**
     * Write a log entry to WooCommerce logs with a specific source.
     *
     * @param string $message The message to log.
     * @param string $source  The log source label.
     * @param string $level   Log level (debug, info, error, etc.).
     */
    protected function log_wc($message, $source = 'team556-pay-gateway', $level = 'debug') {
        if (!$this->logger) {
            $this->logger = wc_get_logger();
        }
        $this->logger->log($level, $message, array('source' => $source));
    }

    /**
     * Unavailability reason
     * @var string
     */
    public $unavailability_reason;

    /**
     * Constructor
     */
    public function __construct() {
        // Properties are already initialized with default values
        $this->unavailability_reason = '';
        $this->logger = null;
        
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
        // add_action('wp_ajax_team556_pay_check_order_status', array($this, 'ajax_check_order_status')); // Moved to a static handler
        // add_action('wp_ajax_nopriv_team556_pay_check_order_status', array($this, 'ajax_check_order_status')); // Moved to a static handler
        add_action('wp_ajax_team556_pay_test', array($this, 'ajax_test'));
        add_action('wp_ajax_nopriv_team556_pay_test', array($this, 'ajax_test'));
        
        // Admin notice for wallet address
        if (is_admin() && empty($this->wallet_address)) {
            add_action('admin_notices', array($this, 'admin_wallet_notice'));
        }
        
        // Enqueue payment scripts
        add_action( 'wp_enqueue_scripts', array( $this, 'payment_scripts' ), 90 ); // Run a bit later

        // Initialize logger (always get a logger so we can write gateway logs)
    $this->logger = wc_get_logger();
    // Write an initialization log so the gateway log file is always created
    $this->log_wc('Team556 Pay Gateway constructor executed', 'team556-pay-gateway', 'info');

    // Additional logger instance for debug_mode if explicit WC_Logger class check is needed
    // Initialize logger if debug mode is enabled (legacy check retained for backwards compatibility)
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
            $this->logger->debug($log_message, array('source' => 'team556-pay-gateway'));
        }
    }

    /**
     * Log messages for debugging.
     *
     * @param string $message The message to log.
     * @param string $level   The log level (e.g., 'info', 'debug', 'error'). Defaults to 'info'.
     */
    public function log($message, $level = 'info') {
        if (!$this->logger) {
            $this->logger = wc_get_logger();
        }
        
        // Make sure we're using a valid log level
        $valid_levels = array('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug');
        if (!in_array($level, $valid_levels)) {
            $level = 'info'; // Default to 'info' if an invalid level is provided
        }
        
        // Log the message
        $this->logger->log($level, $message, array('source' => 'team556-pay-gateway'));
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
     * Display Team556 transaction data in the WooCommerce admin order screen (sidebar).
     *
     * @param WC_Order $order The order object.
     */
    public function display_transaction_data_in_admin( $order ) {
        if ( ! $order || ! is_a( $order, 'WC_Order' ) ) {
            return;
        }

        // Retrieve transaction signature – both current and legacy meta keys.
        $signature = $order->get_meta( '_team556_transaction_signature' );
        if ( empty( $signature ) ) {
            $signature = $order->get_meta( '_team556_pay_signature' );
        }

        if ( empty( $signature ) ) {
            return; // Nothing to display.
        }

        // Build Solana Explorer URL.
        $network       = $this->network ? $this->network : 'mainnet';
        $explorer_url  = 'https://explorer.solana.com/tx/' . $signature;
        if ( 'devnet' === $network ) {
            $explorer_url .= '?cluster=devnet';
        } elseif ( 'testnet' === $network ) {
            $explorer_url .= '?cluster=testnet';
        }

        echo '<p><strong>' . esc_html__( 'Team556 Transaction', 'team556-pay' ) . ':</strong></p>';
        // Truncate signature for readability.
        $short_sig = strlen( $signature ) > 20 ? substr( $signature, 0, 10 ) . '…' . substr( $signature, -10 ) : $signature;
        echo '<p class="code" style="word-break:break-all;">' . esc_html( $short_sig ) . '</p>';
        echo '<p><a href="' . esc_url( $explorer_url ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'View on Solana Explorer', 'team556-pay' ) . '</a></p>';
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

        // Enqueue scripts on checkout, order-pay (receipt), and order-received (thank you) pages.
        global $wp;
        if ( !is_checkout() && !isset($wp->query_vars['order-pay']) && !is_wc_endpoint_url('order-received') ) {
            return;
        }

        // Enqueue the webpack-built blocks bundle that includes qrcode.react
        $asset_file = include( TEAM556_PAY_PLUGIN_DIR . 'assets/js/blocks/index.asset.php' );
        wp_enqueue_script(
            'team556-pay-blocks',
            TEAM556_PAY_PLUGIN_URL . 'assets/js/blocks/index.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );
        
        // Enqueue main payment script and styles
        wp_enqueue_script('team556-pay'); 
        wp_enqueue_style('team556-pay-style');

        wp_localize_script('team556-pay-blocks', 'team556PayGateway', array(
            'ajaxUrl'                => admin_url('admin-ajax.php'),
            'checkOrderStatusNonce'  => wp_create_nonce('team556_pay_check_order_status_nonce'),
            'debugMode'              => $this->debug_mode === 'yes',
            'i18n'                   => array(
                'paymentConfirmed'  => __('Payment confirmed. Redirecting...', 'team556-pay'),
                'errorCheckingStatus'   => __('Error checking payment status.', 'team556-pay'),
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
     * Test AJAX handler
     */
    public function ajax_test() {
        wp_send_json_success(array('message' => 'Test successful'));
        exit;
    }

    /**
     * Page displayed after checkout, where the user makes the payment.
     *
     * @param int $order_id
     */
    public function receipt_page($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            echo '<div class="woocommerce-error">' . esc_html__('Invalid order.', 'team556-pay') . '</div>';
            return;
        }

        $price_data = $this->fetch_team556_price_data();
        $has_price = $price_data && isset($price_data['price']) && $price_data['price'] > 0;
        $solana_pay_url = '';
        if ($has_price) {
            $fiat_total = $order->get_total();
            $token_price = $price_data['price'];
            $team556_amount = $fiat_total / $token_price;
            $team556_amount_formatted = number_format($team556_amount, $this->get_token_decimals(), '.', ''); // Corrected variable name
            $solana_pay_url = $this->create_solana_pay_url($team556_amount, $order_id);
        }

        ?>
        <style>
            .team556-pay-payment-container {
                max-width: 800px;
                margin: 20px auto;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            }
            
            .team556-pay-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding: 0 10px;
            }
            
            .team556-pay-header img {
                margin-right: 12px;
                vertical-align: middle;
                max-height: 32px;
            }
            
            .team556-pay-header h2 {
                margin: 0;
                font-size: 1.3em;
                font-weight: 600;
                color: #333;
            }
            
            .team556-pay-block-info {
                padding: 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background-color: #f9f9f9;
                margin-bottom: 20px;
            }
            
            .team556-pay-block-info p {
                margin: 8px 0;
                line-height: 1.5;
            }
            
            .team556-pay-block-info hr {
                margin: 15px 0;
                border: none;
                border-top: 1px solid #e0e0e0;
            }
            
            .team556-pay-block-info ol {
                padding-left: 20px;
                margin: 5px 0 15px 0;
            }
            
            .team556-pay-block-info ol li {
                margin-bottom: 5px;
            }
            
            .team556-pay-qr-section {
                text-align: center;
                margin: 20px 0;
            }
            
            #team556-pay-qr-code {
                display: flex;
                justify-content: center;
                margin: 15px 0;
                min-height: 200px;
                align-items: center;
            }
            
            .team556-pay-copy-section {
                margin-top: 20px;
                text-align: center;
            }
            
            .team556-pay-copy-input {
                width: 100%;
                max-width: 400px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                background-color: #f8f8f8;
                margin-bottom: 10px;
                word-break: break-all;
            }
            
            .team556-pay-copy-button {
                background-color: #0073aa;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .team556-pay-copy-button:hover {
                background-color: #005a87;
            }
            
            .team556-pay-copy-button:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            
            .team556-pay-loading {
                color: #666;
                font-style: italic;
            }
            
            .team556-pay-instructions {
                font-style: italic;
                font-size: 0.9em;
                color: #666;
                margin-top: 10px;
            }
        </style>

        <div class="team556-pay-payment-container">
            <div class="team556-pay-header">
                <img src="<?php echo esc_url(TEAM556_PAY_PLUGIN_URL . 'assets/images/logo-round-dark.png'); ?>" alt="Team556 Pay" />
                <h2><?php echo wp_kses_post($this->get_option('title')); ?></h2>
            </div>

            <div class="team556-pay-block-info">
                <p><strong>Order Number:</strong> #<?php echo $order->get_order_number(); ?></p>
                <p><strong>Order Total:</strong> <?php echo wc_price($order->get_total()); ?></p>
                <p><strong>Amount Due:</strong> <?php echo esc_html($team556_amount_formatted); ?> TEAM556</p>
                
                <hr>
                
                <div class="team556-pay-qr-section">
                    <p><strong>Scan the QR code to complete the payment</strong></p>
                    <div id="team556-pay-qr-code">
                        <span class="team556-pay-loading">Generating QR Code...</span>
                    </div>
                </div>
                
                <div class="team556-pay-copy-section">
                    <p><strong>Or copy the payment link:</strong></p>
                    <input type="text" id="team556-pay-link" class="team556-pay-copy-input" 
                           value="<?php echo esc_attr($solana_pay_url); ?>" readonly>
                    <br>
                    <button id="team556-copy-link-btn" class="team556-pay-copy-button">
                        Copy Payment Link
                    </button>
                </div>
                
                <hr>
                
                <p class="team556-pay-instructions">
                    Your order will be processed once the payment is confirmed on the network. 
                    This page will automatically refresh and redirect you once payment is received.
                </p>
                
                <!-- Debug test button -->
                <?php if (defined('WP_DEBUG') && WP_DEBUG): ?>
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border: 1px solid #ddd;">
                    <p><strong>Debug:</strong></p>
                    <button id="test-ajax" type="button" style="margin-right: 10px;">Test AJAX</button>
                    <button id="test-status-check" type="button">Test Status Check</button>
                    <div id="debug-output" style="margin-top: 10px; font-family: monospace; font-size: 12px;"></div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Wait for React components to be available
            function waitForQRCodeCanvas() {
                if (typeof window.QRCodeCanvas !== 'undefined' && typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined') {
                    generateQRCode();
                } else {
                    setTimeout(waitForQRCodeCanvas, 100);
                }
            }
            
            function generateQRCode() {
                const qrContainer = document.getElementById('team556-pay-qr-code');
                if (!qrContainer) return;
                
                try {
                    // Clear loading text
                    qrContainer.innerHTML = '';
                    
                    // Create QR code using React
                    const qrElement = window.React.createElement(window.QRCodeCanvas, {
                        value: '<?php echo esc_js($solana_pay_url); ?>',
                        size: 200,
                        fgColor: '#000000',
                        bgColor: '#ffffff',
                        level: 'H'
                    });
                    
                    // Render to DOM
                    window.ReactDOM.render(qrElement, qrContainer);
                } catch (error) {
                    console.error('Error generating QR code:', error);
                    qrContainer.innerHTML = '<span style="color: red;">Error generating QR code. Please use the payment link below.</span>';
                }
            }
            
            // Start QR code generation
            waitForQRCodeCanvas();
            
            // Copy to clipboard functionality
            document.getElementById('team556-copy-link-btn').addEventListener('click', function() {
                const linkInput = document.getElementById('team556-pay-link');
                const button = this;
                
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(linkInput.value).then(function() {
                        button.textContent = 'Copied!';
                        setTimeout(function() { button.textContent = 'Copy Payment Link'; }, 2000);
                    }).catch(function() {
                        fallbackCopyTextToClipboard(linkInput.value, button);
                    });
                } else {
                    fallbackCopyTextToClipboard(linkInput.value, button);
                }
            });
            
            function fallbackCopyTextToClipboard(text, button) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    button.textContent = 'Copied!';
                    setTimeout(function() { button.textContent = 'Copy Payment Link'; }, 2000);
                } catch (err) {
                    console.error('Fallback: Could not copy text: ', err);
                    alert('Please manually copy the payment link from the text field above.');
                }
                
                document.body.removeChild(textArea);
            }
            
            // Order status checking (existing functionality)
            let statusCheckInterval = setInterval(function() {
                // Create FormData object for proper parameter encoding
                const formData = new FormData();
                formData.append('action', 'team556_pay_check_order_status');
                formData.append('order_id', '<?php echo $order_id; ?>');
                formData.append('nonce', '<?php echo wp_create_nonce('team556_pay_check_order_status'); ?>');
                
                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success && (data.data.status === 'paid' || data.data.status === 'processing' || data.data.status === 'completed')) {
                        clearInterval(statusCheckInterval);
                        window.location.href = data.data.redirect_url;
                    }
                })
                .catch(error => console.error('Order status check error:', error));
            }, 3000);
            
            // Debug button handlers
            <?php if (defined('WP_DEBUG') && WP_DEBUG): ?>
            const testAjaxBtn = document.getElementById('test-ajax');
            const testStatusBtn = document.getElementById('test-status-check');
            const debugOutput = document.getElementById('debug-output');
            
            if (testAjaxBtn) {
                testAjaxBtn.addEventListener('click', function() {
                    debugOutput.innerHTML = 'Testing basic AJAX...';
                    
                    fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'action=team556_pay_test'
                    })
                    .then(response => {
                        debugOutput.innerHTML += '<br>Response status: ' + response.status;
                        return response.json();
                    })
                    .then(data => {
                        debugOutput.innerHTML += '<br>Response data: ' + JSON.stringify(data);
                    })
                    .catch(error => {
                        debugOutput.innerHTML += '<br>Error: ' + error.message;
                    });
                });
            }
            
            if (testStatusBtn) {
                testStatusBtn.addEventListener('click', function() {
                    debugOutput.innerHTML = 'Testing order status check...';
                    
                    // Create FormData object for proper parameter encoding
                    const formData = new FormData();
                    formData.append('action', 'team556_pay_check_order_status');
                    formData.append('order_id', '<?php echo $order_id; ?>');
                    formData.append('nonce', '<?php echo wp_create_nonce('team556_pay_check_order_status'); ?>');
                    
                    fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => {
                        debugOutput.innerHTML += '<br>Response status: ' + response.status;
                        if (response.status === 400) {
                            return response.text();
                        }
                        return response.json();
                    })
                    .then(data => {
                        debugOutput.innerHTML += '<br>Response data: ' + (typeof data === 'string' ? data : JSON.stringify(data));
                    })
                    .catch(error => {
                        debugOutput.innerHTML += '<br>Error: ' + error.message;
                    });
                });
            }
            <?php endif; ?>
        });
        </script>
        <?php
    }

    /**
     * Payment fields
     */
    public function payment_fields() {
        // Check maximum order total limit and show error if exceeded (traditional checkout).
        $team556_pay_options    = get_option( 'team556_pay_settings' );
        $enable_max_total_limit = ! empty( $team556_pay_options['enable_max_order_total'] );
        $max_total_setting      = $team556_pay_options['max_order_total'] ?? '';
        $cart_total_fiat        = WC()->cart ? WC()->cart->get_total( 'raw' ) : 0;

        if ( $enable_max_total_limit && $max_total_setting !== '' && is_numeric( $max_total_setting ) && (float) $max_total_setting > 0 && $cart_total_fiat > (float) $max_total_setting ) {
            $error_message = sprintf(
                /* translators: 1: cart total, 2: maximum allowed total */
                __( 'Your order total %1$s exceeds the maximum allowed for Team556 Pay (%2$s). Please choose a different payment method or reduce your order total.', 'team556-pay' ),
                wc_price( $cart_total_fiat ),
                wc_price( (float) $max_total_setting )
            );
            echo '<div class="woocommerce-error">' . esc_html( $error_message ) . '</div>';
            return;
        }

        ?>
        <style>
            .team556-fields-container { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; margin-top: 1em; }
            .team556-fields-header { display: flex; align-items: center; margin-bottom: 15px; }
            .team556-fields-logo { max-width: 40px; margin-right: 15px; }
            .team556-fields-title { font-size: 1.1em; font-weight: 600; margin: 0; }
            .team556-fields-info p { margin: 0.5em 0; }
            .team556-fields-instructions { margin-top: 15px; font-size: 0.9em; }
        </style>
        <div class="team556-fields-container">
            <div class="team556-fields-header">
                <img src="<?php echo esc_url(TEAM556_PAY_PLUGIN_URL . 'assets/images/logo-round-dark.png'); ?>" alt="Team556 Pay" class="team556-fields-logo" />
                <p class="team556-fields-title"><?php echo wp_kses_post($this->get_option('title')); ?></p>
            </div>

            <?php if ($this->description) : ?>
                <p><?php echo wp_kses_post($this->description); ?></p>
            <?php endif; ?>

            <div class="team556-fields-info">
                <?php
                $cart_total_fiat = WC()->cart->get_total('raw');
                if (empty($cart_total_fiat) || $cart_total_fiat <= 0) {
                    echo '<p>' . esc_html__('Please add items to your cart to see payment details.', 'team556-pay') . '</p>';
                } else {
                    $price_data = $this->fetch_team556_price_data();
                    if ($price_data && isset($price_data['price']) && $price_data['price'] > 0) {
                        $token_price = $price_data['price'];
                        $team556_amount = $cart_total_fiat / $token_price;
                        echo '<p><strong>' . esc_html__('Current Price:', 'team556-pay') . '</strong> 1 TEAM556 ≈ ' . esc_html(wc_price($token_price)) . '</p>';
                        echo '<p><strong>' . esc_html__('Order Total:', 'team556-pay') . '</strong> ' . esc_html(wc_price($cart_total_fiat)) . '</p>';
                        echo '<p><strong>' . esc_html__('Amount Due:', 'team556-pay') . '</strong> ' . esc_html(number_format($team556_amount, $this->get_token_decimals(), '.', '')) . ' TEAM556</p>';
                    } else {
                        echo '<p>' . esc_html__('Could not retrieve current token price. The final amount will be calculated on the next page.', 'team556-pay') . '</p>';
                    }
                }
                ?>
            </div>

            <div class="team556-fields-instructions">
                <p><em><?php esc_html_e('After placing your order, you will be shown a QR code to complete the payment with your wallet.', 'team556-pay'); ?></em></p>
            </div>
        </div>
        <?php
    }

    /**
     * Create Solana Pay URL
     */
    private function create_solana_pay_url($amount, $order_id) {
        // Get the merchant wallet address
        $wallet_address = $this->wallet_address;
        // No fallback to test wallet for token mint, should always be the correct one.
        
        // Token mint is hardcoded for security and consistency with plugin requirements
        $token_mint = 'AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5'; // Corrected Team556 Token Mint
        
        // Format the TOKEN amount to a string with appropriate decimal places for the URL
        // Solana Pay spec: For SPL tokens, use "user" units (decimal format), not smallest units
        // TEAM556 token has 9 decimals, so format accordingly
        $token_amount_str = number_format($amount, 9, '.', '');
        
        // Remove trailing zeros for cleaner URLs
        $token_amount_str = rtrim($token_amount_str, '0');
        $token_amount_str = rtrim($token_amount_str, '.');
        
        // Get shop name for label
        $shop_name = get_bloginfo('name');

        // Construct the webhook URL for server-to-server confirmation
        // The wallet will POST the transaction signature to this URL
        $webhook_url = add_query_arg('order_id', $order_id, get_rest_url(null, 'team556-pay/v1/verify-payment'));
        
        // Build Solana Pay URL parameters using proper encoding
        $params = array(
            'spl-token' => $token_mint,
            'amount'    => $token_amount_str,
            // 'reference' => $reference, // uncomment if you want reference key support
            'label'     => $shop_name,
            'message'   => 'Payment for order at ' . $shop_name,
            'url'       => $webhook_url,
        );

        // http_build_query will RFC3986-encode parameters and join them with '&'
        $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

        // Construct the Solana Pay URL
        $solana_pay_url = 'solana:' . $wallet_address . '?' . $query;
        
        // Log the URL if debug mode is enabled
        if ($this->debug_mode === 'yes') {
            }
        
        return $solana_pay_url;
    }

    /**
     * Get the number of decimals for the TEAM556 token.
     *
     * @return int
     */
    public function get_token_decimals() {
        // The number of decimals for the TEAM556 token is 9.
        // This can be made configurable if other tokens are supported in the future.
        return 9;
    }

    /**
     * Static AJAX handler for checking order status.
     * This is hooked from the main plugin class to ensure it's registered during AJAX requests.
     */
    public static function static_ajax_check_order_status_handler() {
        if (ob_get_level()) {
            ob_clean();
        }
        $logger = wc_get_logger();
        $logger->debug('TEAM556 AJAX: static_ajax_check_order_status_handler called', array('source' => 'team556-pay-ajax'));

        // Ensure WooCommerce is active and its functions are available
        if (!class_exists('WooCommerce') || !WC()->payment_gateways()) {
            $logger->error('TEAM556 AJAX Error: WooCommerce or Payment Gateways not available in static_ajax_check_order_status_handler.', array('source' => 'team556-pay-ajax'));
            wp_send_json_error(array('message' => 'WooCommerce critical components not available.'));
            return;
        }

        $gateways = WC()->payment_gateways->payment_gateways();
        if (!isset($gateways['team556_pay'])) {
            $logger->error('TEAM556 AJAX Error: Team556_Pay_Gateway not found in available gateways.', array('source' => 'team556-pay-ajax'));
            wp_send_json_error(array('message' => 'Team556 Pay gateway not available.'));
            return;
        }

        /** @var Team556_Pay_Gateway $gateway_instance */
        $gateway_instance = $gateways['team556_pay'];

        // Now, call the original instance method. 
        // The instance method ajax_check_order_status() will handle nonce, order_id, etc., using $_POST directly.
        // It also handles wp_send_json_success/error and exit.
        $gateway_instance->ajax_check_order_status();
        
        // Fallback if the instance method doesn't exit (it should)
        $logger->warning('TEAM556 AJAX Warning: ajax_check_order_status instance method did not exit as expected.', array('source' => 'team556-pay-ajax'));
        wp_send_json_error(array('message' => 'Gateway handler did not terminate request.'));
    }

    /**
     * Fetch TEAM556 price data from API or cache.
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

        // Main API is fixed for production deployment.
        $main_api_base_url = 'https://team556-main-api.fly.dev';
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
        $this->log('Parent is_available() result: ' . ($parent_is_available ? 'TRUE' : 'FALSE'), 'info');

        if (!$parent_is_available) {
            // If parent says no (e.g., gateway disabled, currency mismatch), then it's definitively unavailable.
            $this->log('Path: Returning FALSE (due to parent).', 'info');
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
            $this->log('Cart total for zero/negative check: ' . wc_price(WC()->cart->get_total('edit')) . ' (Raw: ' . WC()->cart->get_total('edit') . ')', 'info');
        } else {
            $this->log('WC()->cart is not available for zero/negative check.', 'info');
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
                $this->log('CHECKOUT_LIMIT_EXCEEDED: Cart total ' . wc_price($current_cart_total) . ' exceeds maximum ' . wc_price($max_total_value) . '. This will be handled in payment_fields().', 'info');
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

    /**
     * AJAX handler for checking order status
     */
    public function ajax_check_order_status() {
        // Clear any previous output
        if (ob_get_level()) {
            ob_clean();
        }
        
        $this->log_wc('ajax_check_order_status called', 'team556-pay-ajax');
        $this->log_wc('POST data: ' . print_r($_POST, true), 'team556-pay-ajax');
        
        try {
            // Check if nonce is present
            if (!isset($_POST['nonce'])) {
                $this->log_wc('No nonce provided in POST data', 'team556-pay-ajax', 'error');
                wp_send_json_error(array('message' => 'No nonce provided'));
                return;
            }
            
            $this->log_wc('Nonce provided: ' . $_POST['nonce'], 'team556-pay-ajax');
            
            // Verify nonce
            if (!wp_verify_nonce($_POST['nonce'], 'team556_pay_check_order_status')) {
                $this->log_wc('Nonce verification failed', 'team556-pay-ajax', 'error');
                wp_send_json_error(array('message' => 'Invalid nonce'));
                return;
            }
            
            $this->log_wc('Nonce verification successful', 'team556-pay-ajax');
            
            $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
            if (!$order_id) {
                $this->log_wc('Invalid order ID: ' . $order_id, 'team556-pay-ajax', 'error');
                wp_send_json_error(array('message' => 'Invalid order ID'));
                return;
            }
            
            $this->log_wc('Valid order ID: ' . $order_id, 'team556-pay-ajax');
            
            $order = wc_get_order($order_id);
            if (!$order) {
                $this->log_wc('Order not found: ' . $order_id, 'team556-pay-ajax', 'error');
                wp_send_json_error(array('message' => 'Order not found'));
                return;
            }
            
            $this->log_wc('Order found. Status: ' . $order->get_status(), 'team556-pay-ajax');
            
            // Check if order is paid or processing
            if (in_array($order->get_status(), array('processing', 'completed'))) {
                $this->log_wc('Order is paid, redirecting', 'team556-pay-ajax');
                wp_send_json_success(array(
                    'status' => 'paid',
                    'redirect_url' => $this->get_return_url($order)
                ));
                return;
            }
            
            // Check for transaction signature in order meta
            $transaction_signature = $order->get_meta('_team556_transaction_signature');
            if (!empty($transaction_signature)) {
                $this->log_wc('Transaction signature found: ' . $transaction_signature, 'team556-pay-ajax');
                
                // Mark order as paid if not already
                if (!$order->is_paid()) {
                    $order->payment_complete($transaction_signature);
                    $order->add_order_note(__('Payment completed via Team556 Pay. Transaction signature: ' . $transaction_signature, 'team556-pay'));
                    $this->log_wc('Order marked as paid', 'team556-pay-ajax');
                }
                
                wp_send_json_success(array(
                    'status' => 'paid',
                    'redirect_url' => $this->get_return_url($order)
                ));
                return;
            }
            
            // Check webhook verification flag
            $webhook_verified = $order->get_meta('_team556_webhook_verified');
            if ($webhook_verified === 'yes') {
                $this->log_wc('Webhook verification found', 'team556-pay-ajax');
                
                // Mark order as paid if not already
                if (!$order->is_paid()) {
                    $order->payment_complete();
                    $order->add_order_note(__('Payment completed via Team556 Pay webhook verification.', 'team556-pay'));
                    $this->log_wc('Order marked as paid via webhook', 'team556-pay-ajax');
                }
                
                wp_send_json_success(array(
                    'status' => 'paid',
                    'redirect_url' => $this->get_return_url($order)
                ));
                return;
            }
            
            $this->log_wc('No payment detected yet', 'team556-pay-ajax');
            
            // Payment not detected yet
            wp_send_json_success(array(
                'status' => 'pending'
            ));
            
        } catch (Exception $e) {
            $this->log_wc('Exception occurred: ' . $e->getMessage(), 'team556-pay-ajax', 'error');
            $this->log_wc('Exception trace: ' . $e->getTraceAsString(), 'team556-pay-ajax', 'debug');
            wp_send_json_error(array('message' => 'Server error: ' . $e->getMessage()));
        }
    }
} 