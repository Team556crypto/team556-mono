<?php
/**
 * Team556 Solana Pay Settings Class
 * Handles the settings page functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Settings Class
 */
class Team556_Solana_Pay_Settings {
    /**
     * Constructor
     */
    public function __construct() {
        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Main settings
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_wallet_address');
        // Token mint is hardcoded and cannot be changed
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_network', array(
            'type' => 'string',
            'default' => 'mainnet',
            'sanitize_callback' => array($this, 'sanitize_network')
        ));
        
        // Display settings
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_button_text');
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_button_color');
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_success_message');
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_error_message');
        
        // Advanced settings
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_debug_mode');
        register_setting('team556_solana_pay_settings', 'team556_solana_pay_confirmation_blocks');
        
        // Setting sections
        add_settings_section(
            'team556_solana_pay_general',
            __('General Settings', 'team556-solana-pay'),
            array($this, 'render_general_section'),
            'team556-solana-settings'
        );
        
        add_settings_section(
            'team556_solana_pay_display',
            __('Display Settings', 'team556-solana-pay'),
            array($this, 'render_display_section'),
            'team556-solana-settings'
        );
        
        add_settings_section(
            'team556_solana_pay_advanced',
            __('Advanced Settings', 'team556-solana-pay'),
            array($this, 'render_advanced_section'),
            'team556-solana-settings'
        );
        
        // General fields
        add_settings_field(
            'team556_solana_pay_wallet_address',
            __('Merchant Wallet Address', 'team556-solana-pay'),
            array($this, 'render_wallet_address_field'),
            'team556-solana-settings',
            'team556_solana_pay_general'
        );
        
        // Removed token mint field as it's now hardcoded
        
        add_settings_field(
            'team556_solana_pay_network',
            __('Solana Network', 'team556-solana-pay'),
            array($this, 'render_network_field'),
            'team556-solana-settings',
            'team556_solana_pay_general'
        );
        
        // Display fields
        add_settings_field(
            'team556_solana_pay_button_text',
            __('Button Text', 'team556-solana-pay'),
            array($this, 'render_button_text_field'),
            'team556-solana-settings',
            'team556_solana_pay_display'
        );
        
        add_settings_field(
            'team556_solana_pay_button_color',
            __('Button Color', 'team556-solana-pay'),
            array($this, 'render_button_color_field'),
            'team556-solana-settings',
            'team556_solana_pay_display'
        );
        
        add_settings_field(
            'team556_solana_pay_success_message',
            __('Success Message', 'team556-solana-pay'),
            array($this, 'render_success_message_field'),
            'team556-solana-settings',
            'team556_solana_pay_display'
        );
        
        add_settings_field(
            'team556_solana_pay_error_message',
            __('Error Message', 'team556-solana-pay'),
            array($this, 'render_error_message_field'),
            'team556-solana-settings',
            'team556_solana_pay_display'
        );
        
        // Advanced fields
        add_settings_field(
            'team556_solana_pay_debug_mode',
            __('Debug Mode', 'team556-solana-pay'),
            array($this, 'render_debug_mode_field'),
            'team556-solana-settings',
            'team556_solana_pay_advanced'
        );
        
        add_settings_field(
            'team556_solana_pay_confirmation_blocks',
            __('Confirmation Blocks', 'team556-solana-pay'),
            array($this, 'render_confirmation_blocks_field'),
            'team556-solana-settings',
            'team556_solana_pay_advanced'
        );
    }

    /**
     * Sanitize network
     */
    public function sanitize_network($value) {
        $allowed_networks = array('mainnet', 'devnet', 'testnet');
        return in_array($value, $allowed_networks) ? $value : 'mainnet';
    }

    /**
     * Render general section
     */
    public function render_general_section() {
        echo '<p>' . __('Configure your Team556 Solana Pay merchant settings.', 'team556-solana-pay') . '</p>';
    }

    /**
     * Render display section
     */
    public function render_display_section() {
        echo '<p>' . __('Customize how the payment buttons and messages appear to customers.', 'team556-solana-pay') . '</p>';
    }

    /**
     * Render advanced section
     */
    public function render_advanced_section() {
        echo '<p>' . __('Advanced settings for developers and troubleshooting.', 'team556-solana-pay') . '</p>';
    }

    /**
     * Render wallet address field
     */
    public function render_wallet_address_field() {
        $value = get_option('team556_solana_pay_wallet_address', '');
        ?>
        <input type="text" name="team556_solana_pay_wallet_address" value="<?php echo esc_attr($value); ?>" class="regular-text team556-input" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);" />
        <p class="description"><?php _e('Enter your Solana wallet address where you will receive Team556 token payments.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render network field
     */
    public function render_network_field() {
        $value = get_option('team556_solana_pay_network', 'mainnet');
        ?>
        <select name="team556_solana_pay_network" class="team556-select" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);">
            <option value="mainnet" <?php selected($value, 'mainnet'); ?>><?php _e('Mainnet', 'team556-solana-pay'); ?></option>
            <option value="devnet" <?php selected($value, 'devnet'); ?>><?php _e('Devnet', 'team556-solana-pay'); ?></option>
            <option value="testnet" <?php selected($value, 'testnet'); ?>><?php _e('Testnet', 'team556-solana-pay'); ?></option>
        </select>
        <p class="description"><?php _e('Select the Solana network to use for transactions.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render button text field
     */
    public function render_button_text_field() {
        $value = get_option('team556_solana_pay_button_text', __('Pay with Team556 Token', 'team556-solana-pay'));
        ?>
        <input type="text" name="team556_solana_pay_button_text" value="<?php echo esc_attr($value); ?>" class="regular-text team556-input" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);" />
        <p class="description"><?php _e('Customize the text displayed on the payment button.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render button color field
     */
    public function render_button_color_field() {
        $value = get_option('team556_solana_pay_button_color', '#9945FF');
        ?>
        <input type="color" name="team556_solana_pay_button_color" value="<?php echo esc_attr($value); ?>" class="team556-color-picker" />
        <p class="description"><?php _e('Choose a color for the payment button.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render success message field
     */
    public function render_success_message_field() {
        $value = get_option('team556_solana_pay_success_message', __('Payment successful! Thank you for your purchase.', 'team556-solana-pay'));
        ?>
        <textarea name="team556_solana_pay_success_message" rows="3" class="large-text team556-textarea" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);"><?php echo esc_textarea($value); ?></textarea>
        <p class="description"><?php _e('Message displayed to customers after a successful payment.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render error message field
     */
    public function render_error_message_field() {
        $value = get_option('team556_solana_pay_error_message', __('Payment failed. Please try again or contact support.', 'team556-solana-pay'));
        ?>
        <textarea name="team556_solana_pay_error_message" rows="3" class="large-text team556-textarea" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);"><?php echo esc_textarea($value); ?></textarea>
        <p class="description"><?php _e('Message displayed to customers if payment fails.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render debug mode field
     */
    public function render_debug_mode_field() {
        $value = get_option('team556_solana_pay_debug_mode', '0');
        ?>
        <label>
            <input type="checkbox" name="team556_solana_pay_debug_mode" value="1" <?php checked($value, '1'); ?> class="team556-checkbox" />
            <?php _e('Enable debug logging', 'team556-solana-pay'); ?>
        </label>
        <p class="description"><?php _e('Logs additional debugging information to the WordPress error log.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render confirmation blocks field
     */
    public function render_confirmation_blocks_field() {
        $value = get_option('team556_solana_pay_confirmation_blocks', '1');
        ?>
        <input type="number" name="team556_solana_pay_confirmation_blocks" value="<?php echo esc_attr($value); ?>" min="1" max="32" class="small-text team556-input" style="background-color: #1C1D24; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.08);" />
        <p class="description"><?php _e('Number of block confirmations required before considering a transaction complete.', 'team556-solana-pay'); ?></p>
        <?php
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap team556-admin-settings">
            <h1><?php _e('Team556 Solana Pay Settings', 'team556-solana-pay'); ?></h1>
            
            <?php settings_errors(); ?>
            
            <div class="team556-card team556-settings-form-card">
                <form method="post" action="options.php" class="team556-settings-form">
                    <?php
                    settings_fields('team556_solana_pay_settings');
                    do_settings_sections('team556-solana-settings');
                    submit_button(__('Save Changes', 'team556-solana-pay'), 'team556-button primary'); 
                    ?>
                </form>
            </div>
            
            <div class="team556-card team556-settings-help-card">
                <h2><?php _e('Need Help?', 'team556-solana-pay'); ?></h2>
                <div class="team556-help-content">
                    <h3><?php _e('Wallet Address', 'team556-solana-pay'); ?></h3>
                    <p><?php _e('Your wallet address is where Team556 token payments will be sent. Make sure to use a Solana wallet address that supports SPL tokens.', 'team556-solana-pay'); ?></p>
                    
                    <h3><?php _e('Network Selection', 'team556-solana-pay'); ?></h3>
                    <p><?php _e('Choose Mainnet for real transactions. Devnet and Testnet are for testing purposes only and use test tokens.', 'team556-solana-pay'); ?></p>
                    
                    <h3><?php _e('Shortcode Usage', 'team556-solana-pay'); ?></h3>
                    <p><?php _e('Add a payment button to any page or post using this shortcode:', 'team556-solana-pay'); ?></p>
                    <code>[team556_solana_pay amount="10" description="Product Name" button_text="Pay Now"]</code>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Check if we're on the settings page
        if (strpos($hook, 'team556-solana-settings') !== false || strpos($hook, 'team556-solana-pay') !== false) {
            // Enqueue admin styles
            wp_enqueue_style(
                'team556-solana-pay-admin',
                TEAM556_SOLANA_PAY_PLUGIN_URL . 'assets/css/team556-solana-pay-admin.css',
                array(),
                TEAM556_SOLANA_PAY_VERSION
            );
        }
    }
} 