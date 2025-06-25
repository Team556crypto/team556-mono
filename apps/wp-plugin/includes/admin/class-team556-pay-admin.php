<?php
/**
 * Team556 Solana Pay Admin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Team556 Solana Pay Admin
 */
class Team556_Pay_Admin {
    /**
     * Constructor
     */
    public function __construct() {

        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Add meta box to order page
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
    }


    /**
     * Register settings
     */
    public function register_settings() {
        // Settings are now registered in the Team556_Pay_Settings class
        // This prevents duplicate registration
    }

    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        $dashboard = new Team556_Pay_Dashboard();
        $dashboard->render_dashboard_page();
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        // Add meta box to WooCommerce orders if WooCommerce is active
        if (class_exists('WooCommerce')) {
            add_meta_box(
                'team556_solana_pay_order_details',
                __('Team556 Solana Pay Details', 'team556-pay'),
                array($this, 'render_order_meta_box'),
                'shop_order',
                'side',
                'default'
            );
        }
    }

    /**
     * Render order meta box
     */
    public function render_order_meta_box($post) {
        $order = wc_get_order($post->ID);
        
        if (!$order || $order->get_payment_method() !== 'team556_solana_pay') {
            echo '<p>' . __('This order was not paid with Team556 Solana Pay.', 'team556-pay') . '</p>';
            return;
        }
        
        // Get transaction signature from order meta (would be stored during payment processing)
        $signature = $order->get_meta('_team556_solana_pay_signature');
        
        if (!$signature) {
            echo '<p>' . __('No transaction details found.', 'team556-pay') . '</p>';
            return;
        }
        
        $network = get_option('team556_solana_pay_network', 'mainnet');
        $explorer_url = 'https://explorer.solana.com/tx/' . $signature;
        
        if ($network === 'devnet') {
            $explorer_url = 'https://explorer.solana.com/tx/' . $signature . '?cluster=devnet';
        } elseif ($network === 'testnet') {
            $explorer_url = 'https://explorer.solana.com/tx/' . $signature . '?cluster=testnet';
        }
        
        ?>
        <p><strong><?php _e('Transaction Signature:', 'team556-pay'); ?></strong></p>
        <p class="signature-ellipsis"><?php echo esc_html(substr($signature, 0, 10) . '...' . substr($signature, -10)); ?></p>
        <p><a href="<?php echo esc_url($explorer_url); ?>" target="_blank"><?php _e('View on Solana Explorer', 'team556-pay'); ?></a></p>
        <?php
    }

    /**
     * Render transactions page
     */
    public function render_transactions_page() {
        // TODO: Implement transactions page rendering
    }
}

// Initialize admin class
new Team556_Pay_Admin(); 