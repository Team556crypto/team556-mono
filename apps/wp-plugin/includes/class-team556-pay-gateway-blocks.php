<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

/**
 * Team556 Pay Blocks integration
 *
 * @since 1.1.0
 */
final class Team556_Pay_Gateway_Blocks_Integration extends AbstractPaymentMethodType {
    /**
     * The gateway instance.
     *
     * @var Team556_Pay_Gateway
     */
    private $gateway;

    /**
     * Payment method name/id, must be equivalent to the classic gateway id.
     *
     * @var string
     */
    protected $name = 'team556_pay'; // This MUST match your classic gateway ID

    /**
     * Constructor
     * We need to pass the gateway instance to this class.
     */
    public function __construct() {
        error_log('[Team556 Pay Blocks] Constructor called for integration class.');
        // Gateway instance will be fetched by get_gateway_instance() when needed.
    }

    /**
     * Initializes the payment method type.
     */
    public function initialize() {
        // Settings are usually managed by the classic gateway.
        // We can access them via $this->gateway->get_option()
    }

    /**
     * Returns if this payment method should be active. If false, the scripts will not be enqueued.
     *
     * @return boolean
     */
    /**
     * Get the gateway instance.
     *
     * @return Team556_Pay_Gateway|false
     */
    protected function get_gateway_instance() {
        if ( ! isset( $this->gateway ) ) {
            error_log('[Team556 Pay Blocks] get_gateway_instance: Gateway instance not set. Attempting to fetch.');
            $all_gateways = WC()->payment_gateways()->payment_gateways();
            if ( isset( $all_gateways[$this->name] ) ) {
                $this->gateway = $all_gateways[$this->name];
                error_log('[Team556 Pay Blocks] get_gateway_instance: Gateway instance for ' . $this->name . ' fetched and set.');
            } else {
                error_log('[Team556 Pay Blocks] get_gateway_instance: Could not fetch gateway ' . $this->name . ' from WC()->payment_gateways(). Available: ' . implode(', ', array_keys($all_gateways)));
                return false;
            }
        }
        return $this->gateway;
    }

    public function is_active() {
        error_log('[Team556 Pay Blocks] is_active() CALLED.');
        $gateway = $this->get_gateway_instance();

        if ( ! $gateway ) {
            error_log('[Team556 Pay Blocks] is_active: Gateway instance NOT found. Returning false.');
            return false;
        }

        // In the block editor/admin context (not on the actual checkout page) the regular
        // `is_available()` check will often fail because it relies on `is_checkout()`. Instead,
        // consider the payment method active if the gateway itself is enabled in settings.
        if ( is_admin() ) {
            $enabled = isset( $gateway->enabled ) && 'yes' === $gateway->enabled;
            error_log('[Team556 Pay Blocks] is_active: Admin context detected. Gateway enabled flag is ' . ( $enabled ? 'yes' : 'no' ) . '.');
            return $enabled;
        }

        // Front-end (actual checkout) – use the classic availability logic.
        $is_gateway_available = $gateway->is_available();
        error_log('[Team556 Pay Blocks] is_active: Frontend context. Main gateway is_available() returned: ' . ( $is_gateway_available ? 'true' : 'false' ) );

        return $is_gateway_available;
    }

    /**
     * Returns an array of script handles to enqueue for this payment method in the frontend context.
     *
     * @return string[]
     */
    public function get_payment_method_script_handles() {
        // Define the script path and asset file path
        // Assumes your build process outputs to assets/js/blocks/
        $script_path       = TEAM556_PAY_PLUGIN_URL . 'assets/js/blocks/index.js';
        $script_asset_path = TEAM556_PAY_PLUGIN_DIR . 'assets/js/blocks/index.asset.php';
        
        // Default asset values if the asset file doesn't exist
        $default_asset = array(
            'dependencies' => array(),
            'version'      => defined('TEAM556_PAY_VERSION') ? TEAM556_PAY_VERSION : '1.0.0',
        );
        $script_asset  = file_exists( $script_asset_path )
            ? require( $script_asset_path )
            : $default_asset;

        // Ensure WooCommerce Blocks specific dependencies are present. These script handles are
        // registered by WooCommerce/Blocks and are required for `@woocommerce/blocks-registry`
        // and `@woocommerce/settings` packages used in our JS bundle.
        $extra_deps = array( 'wc-blocks-registry', 'wc-settings' );
        $dependencies = array_unique( array_merge( $script_asset['dependencies'], $extra_deps ) );

        wp_register_script(
            'team556-pay-blocks-integration', // Handle for your script
            $script_path,
            $dependencies,
            $script_asset['version'],
            true // Load in footer
        );

        // Load translations if available.
        if ( function_exists( 'wp_set_script_translations' ) ) {
            wp_set_script_translations( 'team556-pay-blocks-integration', 'team556-pay', TEAM556_PAY_PLUGIN_DIR . 'languages' );
        }

        return array( 'team556-pay-blocks-integration' );
    }

    /**
     * Returns an array of script handles to enqueue for this payment method in the admin context.
     *
     * @return string[]
     */
    public function get_payment_method_script_handles_for_admin() {
        // Re-use the same script handles for the block editor context.
        error_log('[Team556 Pay Blocks] get_payment_method_script_handles_for_admin called.');
        return $this->get_payment_method_script_handles();
    }

    /**
     * Returns an array of key=>value pairs of data made available to the payment methods script.
     *
     * @return array
     */
    public function get_payment_method_data() {
        $this->get_gateway_instance(); // Ensure $this->gateway is populated

        if ( ! $this->gateway ) {
            error_log('[Team556 Pay Blocks] get_payment_method_data: Gateway instance is NOT available after explicit fetch. Returning error data.');
            // Return minimal data to prevent JS errors, but indicate a problem
            return array(
                'title'       => __( 'Team556 Pay (Error)', 'team556-pay' ),
                'description' => __( 'Could not initialize Team556 Pay. Please check plugin settings and WooCommerce logs.', 'team556-pay' ),
                'supports'    => array( 'products' ), // Default to prevent JS errors
                'icon'        => '', // No icon if there's an error
            );
        }

        error_log('[Team556 Pay Blocks] get_payment_method_data: Gateway instance IS available. Title: ' . $this->gateway->get_title());
        error_log('[Team556 Pay Blocks] get_payment_method_data: Original supports from gateway: ' . print_r($this->gateway->supports, true));

        return array(
            'title'       => $this->gateway->get_title(),
            'description' => $this->gateway->get_description(),
            'supports'    => $this->filter_gateway_supports( $this->gateway->supports ),
            'icon'        => $this->gateway->get_icon_url_for_blocks(), // We might need a specific method for this
            // Add any other data your frontend component might need
            // For example, API keys (publishable ones!), URLs, nonces etc.
            // 'publishableKey' => $this->gateway->get_option('publishable_key'),
        );
    }

    /**
     * Filter gateway supports
     *
     * @param array $support
     * @return array
     */
    public function filter_gateway_supports( $support ) {
        error_log('[Team556 Pay Blocks] filter_gateway_supports called with original supports: ' . print_r( $support, true ) );
        // Ensure 'products' is supported if the original supports array is empty or doesn't include it.
        // WooCommerce Blocks generally expects payment methods to support 'products'.
        if ( empty( $support ) || !is_array( $support ) ) {
            $support = ['products'];
            error_log('[Team556 Pay Blocks] filter_gateway_supports: Original supports empty or not an array, defaulting to ["products"].');
        } elseif ( !in_array( 'products', $support ) ) {
            $support[] = 'products';
            error_log('[Team556 Pay Blocks] filter_gateway_supports: Added "products" to supports.');
        }
        error_log('[Team556 Pay Blocks] filter_gateway_supports: Returning supports: ' . print_r( $support, true ) );
        return $support;
    }
}
