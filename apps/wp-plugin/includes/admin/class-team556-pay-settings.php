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
class Team556_Pay_Settings {
    /**
     * Constructor
     */
    public function __construct() {
        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Add settings page to menu
        add_action('admin_menu', array($this, 'add_settings_page_menu'));
    }

    /**
     * Add settings page to the admin menu
     */
    public function add_settings_page_menu() {
        add_options_page(
            __('Team556 Pay Settings', 'team556-pay'),
            __('Team556 Pay', 'team556-pay'), // Menu title under Settings
            'manage_options',
            'team556-pay-settings', // Page slug
            array($this, 'render_settings_page') // Callback to render the page
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Main settings
        register_setting('team556_pay_settings', 'team556_pay_settings', array($this, 'sanitize_settings'));
        
        // Setting sections
        add_settings_section(
            'team556_pay_general',
            __('General Settings', 'team556-pay'),
            array($this, 'render_general_section'),
            'team556-pay-settings'
        );
        
        add_settings_section(
            'team556_pay_display',
            __('Display Settings', 'team556-pay'),
            array($this, 'render_display_section'),
            'team556-pay-settings'
        );
        
        add_settings_section(
            'team556_pay_advanced',
            __('Advanced Settings', 'team556-pay'),
            array($this, 'render_advanced_section'),
            'team556-pay-settings'
        );
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized_input = array();
        
        // Merchant wallet address
        $sanitized_input['merchant_wallet_address'] = sanitize_text_field($input['merchant_wallet_address']);
        
        // Solana network
        $allowed_networks = array('mainnet', 'devnet', 'testnet');
        $sanitized_input['solana_network'] = in_array($input['solana_network'], $allowed_networks) ? $input['solana_network'] : 'mainnet';
        
        // Button text
        $sanitized_input['button_text'] = sanitize_text_field($input['button_text']);
        
        // Button color
        $sanitized_input['button_color'] = sanitize_text_field($input['button_color']);
        
        // Success message
        $sanitized_input['success_message'] = sanitize_textarea_field($input['success_message']);
        
        // Error message
        $sanitized_input['error_message'] = sanitize_textarea_field($input['error_message']);
        
        // Debug mode
        $sanitized_input['debug_mode'] = isset($input['debug_mode']) ? 1 : 0;
        
        // Confirmation blocks
        $sanitized_input['confirmation_blocks'] = absint($input['confirmation_blocks']);
        
        return $sanitized_input;
    }

    /**
     * Render general section
     */
    public function render_general_section() {
        echo '<p>' . __('Configure your Team556 Solana Pay merchant settings.', 'team556-pay') . '</p>';
    }

    /**
     * Render display section
     */
    public function render_display_section() {
        echo '<p>' . __('Customize how the payment buttons and messages appear to customers.', 'team556-pay') . '</p>';
    }

    /**
     * Render advanced section
     */
    public function render_advanced_section() {
        echo '<p>' . __('Advanced settings for developers and troubleshooting.', 'team556-pay') . '</p>';
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Get saved options
        $options = get_option('team556_pay_settings');
        
        ?>
        <div class="team556-dark-theme-wrapper">
            <div class="wrap team556-admin-settings">
                <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
                
                <?php settings_errors(); // Still show WordPress settings errors ?>
                
                <form method="post" action="options.php" class="team556-settings-form">
                    <?php settings_fields('team556_pay_settings'); // Nonces etc. ?>
                    
                    <div class="team556-card team556-settings-form-card">
                        <h2><?php _e('General Settings', 'team556-pay'); ?></h2>
                        <p class="description"><?php _e('Configure your Team556 Solana Pay merchant settings.', 'team556-pay'); ?></p>
                        
                        <div class="form-group">
                            <label for="merchant_wallet_address"><?php _e('Merchant Wallet Address', 'team556-pay'); ?></label>
                            <input type="text" id="merchant_wallet_address" name="team556_pay_settings[merchant_wallet_address]" value="<?php echo esc_attr($options['merchant_wallet_address'] ?? ''); ?>" class="regular-text">
                            <p class="description"><?php _e('Enter your Solana wallet address where you will receive Team556 token payments.', 'team556-pay'); ?></p>
                        </div>
                        
                        <div class="form-group">
                            <label for="solana_network"><?php _e('Solana Network', 'team556-pay'); ?></label>
                            <select id="solana_network" name="team556_pay_settings[solana_network]">
                                <option value="mainnet" <?php selected($options['solana_network'] ?? 'mainnet', 'mainnet'); ?>><?php _e('Mainnet', 'team556-pay'); ?></option>
                                <option value="devnet" <?php selected($options['solana_network'] ?? '', 'devnet'); ?>><?php _e('Devnet', 'team556-pay'); ?></option>
                                <option value="testnet" <?php selected($options['solana_network'] ?? '', 'testnet'); ?>><?php _e('Testnet', 'team556-pay'); ?></option>
                            </select>
                            <p class="description"><?php _e('Select the Solana network to use for transactions.', 'team556-pay'); ?></p>
                        </div>

                        <hr>

                        <h2><?php _e('Display Settings', 'team556-pay'); ?></h2>
                        <p class="description"><?php _e('Customize how the payment buttons and messages appear to customers.', 'team556-pay'); ?></p>

                        <div class="form-group">
                            <label for="button_text"><?php _e('Button Text', 'team556-pay'); ?></label>
                            <input type="text" id="button_text" name="team556_pay_settings[button_text]" value="<?php echo esc_attr($options['button_text'] ?? __('Pay with Team556 Token', 'team556-pay')); ?>" class="regular-text">
                            <p class="description"><?php _e('Customize the text displayed on the payment button.', 'team556-pay'); ?></p>
                        </div>

                        <div class="form-group">
                            <label for="button_color"><?php _e('Button Color', 'team556-pay'); ?></label>
                            <input type="color" id="button_color" name="team556_pay_settings[button_color]" value="<?php echo esc_attr($options['button_color'] ?? '#6a0dad'); ?>" class="team556-color-picker">
                            <p class="description"><?php _e('Choose a color for the payment button.', 'team556-pay'); ?></p>
                        </div>

                        <div class="form-group">
                            <label for="success_message"><?php _e('Success Message', 'team556-pay'); ?></label>
                            <textarea id="success_message" name="team556_pay_settings[success_message]" rows="3" class="large-text"><?php echo esc_textarea($options['success_message'] ?? __('Payment successful! Thank you for your purchase.', 'team556-pay')); ?></textarea>
                            <p class="description"><?php _e('Message displayed to customers after a successful payment.', 'team556-pay'); ?></p>
                        </div>

                        <div class="form-group">
                            <label for="error_message"><?php _e('Error Message', 'team556-pay'); ?></label>
                            <textarea id="error_message" name="team556_pay_settings[error_message]" rows="3" class="large-text"><?php echo esc_textarea($options['error_message'] ?? __('Payment failed. Please try again or contact support.', 'team556-pay')); ?></textarea>
                            <p class="description"><?php _e('Message displayed to customers if payment fails.', 'team556-pay'); ?></p>
                        </div>

                        <hr>

                        <h2><?php _e('Advanced Settings', 'team556-pay'); ?></h2>
                        <p class="description"><?php _e('Advanced settings for developers and troubleshooting.', 'team556-pay'); ?></p>

                        <div class="form-group form-group-checkbox">
                            <label for="debug_mode">
                                <input type="checkbox" id="debug_mode" name="team556_pay_settings[debug_mode]" value="1" <?php checked($options['debug_mode'] ?? 0, 1); ?>>
                                <?php _e('Enable Debug Mode', 'team556-pay'); ?>
                            </label>
                            <p class="description"><?php _e('Logs additional debugging information to the WordPress error log.', 'team556-pay'); ?></p>
                        </div>

                        <div class="form-group">
                            <label for="confirmation_blocks"><?php _e('Confirmation Blocks', 'team556-pay'); ?></label>
                            <input type="number" id="confirmation_blocks" name="team556_pay_settings[confirmation_blocks]" value="<?php echo esc_attr($options['confirmation_blocks'] ?? 1); ?>" min="1" max="30" class="small-text">
                            <p class="description"><?php _e('Number of block confirmations required before considering a transaction complete.', 'team556-pay'); ?></p>
                        </div>
                        
                        <?php submit_button(__('Save Changes', 'team556-pay'), 'team556-button primary'); ?>
                    </div> <!-- /team556-settings-form-card -->
                </form>
                
                <div class="team556-card team556-settings-help-card">
                    <h2><?php _e('Need Help?', 'team556-pay'); ?></h2>
                    <div class="team556-help-content">
                        <h3><?php _e('Wallet Address', 'team556-pay'); ?></h3>
                        <p><?php _e('Your wallet address is where Team556 token payments will be sent. Make sure to use a Solana wallet address that supports SPL tokens.', 'team556-pay'); ?></p>
                        
                        <h3><?php _e('Network Selection', 'team556-pay'); ?></h3>
                        <p><?php _e('Choose Mainnet for real transactions. Devnet and Testnet are for testing purposes only and use test tokens.', 'team556-pay'); ?></p>
                        
                        <h3><?php _e('Shortcode Usage', 'team556-pay'); ?></h3>
                        <p><?php _e('Add a payment button to any page or post using this shortcode:', 'team556-pay'); ?></p>
                        <code>[team556_pay_button amount="10" description="Product Name" button_text="Pay Now"]</code>
                    </div>
                </div>
            </div>
        </div> <!-- /team556-dark-theme-wrapper -->
        <?php
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Check if we're on the plugin's settings page
        // The hook for add_options_page is settings_page_{menu_slug}
        if ($hook === 'settings_page_team556-pay-settings') {
            // Enqueue admin styles
            // It's good practice to use unique handles for scripts and styles
            wp_enqueue_style(
                'team556-pay-admin-settings-styles',
                TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-pay-admin.css', // Path to your admin CSS
                array(),
                TEAM556_PAY_VERSION
            );

            // Enqueue admin scripts
            wp_enqueue_script(
                'team556-pay-admin-settings-js',
                TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-pay-admin.js', // Path to your admin JS
                array('jquery', 'wp-color-picker'), // Dependencies
                TEAM556_PAY_VERSION,
                true // Load in footer
            );
        }
    }
}