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
 * Check if the gateway is available for use.
 * Overridden for debugging purposes.
 *
 * @return bool
 */
public function is_available() {
    $is_available = parent::is_available();

    if (!$is_available) {
        return false;
    }

    $team556_pay_options = get_option('team556_pay_settings');
    $wallet_address = !empty($this->get_option('wallet_address')) ? $this->get_option('wallet_address') : (!empty($team556_pay_options['merchant_wallet_address']) ? $team556_pay_options['merchant_wallet_address'] : '');

    if (empty($wallet_address) || !defined('TEAM556_PAY_TEAM556_TOKEN_MINT')) {
        return false;
    }

    if (WC()->cart && WC()->cart->get_total('edit') <= 0) {
        return false;
    }

    return true;
}

/**
 * Process the payment
 *
 * @param int $order_id
 * @return array
 */
public function process_payment($order_id) {
    $order = wc_get_order($order_id);

    // Final server-side check for maximum order total before processing payment
    $team556_pay_options = get_option('team556_pay_settings');
    $enable_max_total_limit = isset($team556_pay_options['enable_max_order_total']) && $team556_pay_options['enable_max_order_total'] == 1;
    $max_total_setting = isset($team556_pay_options['max_order_total']) ? $team556_pay_options['max_order_total'] : '';

    if ($enable_max_total_limit && !empty($max_total_setting) && is_numeric($max_total_setting)) {
        if ($order->get_total() > (float)$max_total_setting) {
            wc_add_notice(sprintf(__('Order total exceeds the maximum of %s for Team556 Pay.', 'team556-pay'), wc_price($max_total_setting)), 'error');
            return ['result' => 'failure', 'redirect' => wc_get_checkout_url()];
        }
    }

    $order->update_status('pending', __('Awaiting Team556 token payment.', 'team556-pay'));
    return ['result' => 'success', 'redirect' => $order->get_checkout_payment_url(true)];
}

/**
 * Payment fields
 */
public function payment_fields() {
    $team556_pay_options = get_option('team556_pay_settings');
    $enable_max_total_limit = isset($team556_pay_options['enable_max_order_total']) && $team556_pay_options['enable_max_order_total'] == 1;
    $max_total_setting = isset($team556_pay_options['max_order_total']) ? (float)$team556_pay_options['max_order_total'] : 0;
    $cart_total = WC()->cart->get_total('edit');
    $limit_exceeded = $enable_max_total_limit && $max_total_setting > 0 && $cart_total > $max_total_setting;

    echo '<div class="team556-fields-container">';
    if ($this->description) {
        echo '<p>' . wp_kses_post($this->description) . '</p>';
    }

    if ($limit_exceeded) {
        echo '<div class="woocommerce-error">' . sprintf(__('Your order total of %s exceeds the maximum allowed for Team556 Pay, which is %s.', 'team556-pay'), wc_price($cart_total), wc_price($max_total_setting)) . '</div>';
        wc_enqueue_js("jQuery(function($){ if ($('input[name=\"payment_method\"]:checked').val() === 'team556_pay') { $('#place_order').prop('disabled', true); } });");
    } else {
        echo '<p><em>' . esc_html__('You will be redirected to a secure page to complete your payment using your Solana wallet.', 'team556-pay') . '</em></p>';
    }
    echo '</div>';
}
    public function fetch_team556_price_data() {
        $transient_key = 'team556_main_api_price_data';
        $cached_data = get_transient($transient_key);

        if (false !== $cached_data && isset($cached_data['price'])) {
            $this->log_debug('TEAM556 Price: Returning cached data.');
            $cached_data['source'] = 'cache';
            return $cached_data;
        }

        $this->log_debug('TEAM556 Price: Cache miss or expired, fetching from main-api.');

        $main_api_base_url = 'https://team556-main-api.fly.dev';
        $api_url = $main_api_base_url . '/api/price/team556-usdc';

        if ($this->debug_mode === 'yes') {
            $this->log_debug('TEAM556 Price: Requesting URL: ' . $api_url);
        }

        $response = wp_remote_get($api_url, array('timeout' => 10));

        if (is_wp_error($response)) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: WP Error fetching price: ' . $response->get_error_message());
            }
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ($status_code !== 200) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: API returned non-200 status: ' . $status_code);
            }
            return false;
        }

        $data = json_decode($body, true);

        if (empty($data) || !isset($data['price_usdc']) || !is_numeric($data['price_usdc'])) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: Invalid data structure or missing price_usdc from main-api response.');
            }
            return false;
        }

        $price_str = $data['price_usdc'];

        if (!is_numeric($price_str) || bccomp($price_str, '0', 9) <= 0) {
            if ($this->debug_mode === 'yes') {
                $this->log_debug('TEAM556 Price: Price value is not positive: ' . $price_str);
            }
            return false;
        }

        $price_info = [
            'price'        => $price_str,
            'last_updated' => time(),
            'source'       => 'api (via main-api: ' . (isset($data['source']) ? $data['source'] : 'unknown') . ')',
            'api_timestamp'=> isset($data['timestamp']) ? $data['timestamp'] : null,
        ];

        set_transient($transient_key, $price_info, 60);

        if ($this->debug_mode === 'yes') {
            $this->log_debug('TEAM556 Price: Successfully fetched and cached. Price: ' . $price_str);
        }
        return $price_info;
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