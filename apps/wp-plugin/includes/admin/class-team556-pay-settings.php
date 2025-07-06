<?php
/**
 * Team556 Pay Settings Class
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
        
        // Solana network - Force to mainnet
        $sanitized_input['solana_network'] = 'mainnet';
        

        // Debug mode
        $sanitized_input['debug_mode'] = isset($input['debug_mode']) ? 1 : 0;
        
        // Confirmation blocks
        $sanitized_input['confirmation_blocks'] = absint($input['confirmation_blocks'] ?? 1); // Ensure default if not set

        // Enable Maximum Order Total Limit
        $sanitized_input['enable_max_order_total'] = isset($input['enable_max_order_total']) ? 1 : 0;

        // Maximum Order Total
        if (isset($input['max_order_total'])) {
            if ($input['max_order_total'] === '' || $input['max_order_total'] === null) {
                $sanitized_input['max_order_total'] = ''; // Allow empty to disable
            } else {
                // Sanitize as a positive decimal number
                $max_total = wc_format_decimal($input['max_order_total'], wc_get_price_decimals());
                $sanitized_input['max_order_total'] = ($max_total >= 0) ? (string) $max_total : '';
            }
        } else {
            $sanitized_input['max_order_total'] = ''; // Default to empty if not set
        }

        
        return $sanitized_input;
    }

    /**
     * Render general section
     */
    public function render_general_section() {
        echo '<p>' . __('Configure your Team556 Pay merchant settings.', 'team556-pay') . '</p>';
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
                <div class="team556-welcome-header" style="margin-bottom:var(--team556-spacing-large);">
                    <div class="team556-welcome-logo">
                        <img src="<?php echo TEAM556_PAY_PLUGIN_URL; ?>assets/images/logo-round-dark.png" alt="Team556 Pay" style="max-width:80px; height:auto;" />
                    </div>
                    <div class="team556-welcome-intro">
                        <h1 style="margin:0;"><?php echo esc_html(get_admin_page_title()); ?></h1>
                    </div>
                </div>
                
                <?php settings_errors(); // Still show WordPress settings errors ?>
                
                <form method="post" action="options.php" class="team556-settings-form">
                    <?php settings_fields('team556_pay_settings'); // Nonces etc. ?>
                    
                    <div class="team556-card team556-settings-form-card">
                        <h2><?php _e('General Settings', 'team556-pay'); ?></h2>
                        <p class="description"><?php _e('Configure your Team556 Pay merchant settings.', 'team556-pay'); ?></p>
                        
                        <div class="form-group">
                            <label for="merchant_wallet_address"><?php _e('Merchant Wallet Address', 'team556-pay'); ?></label>
                            <input type="text" id="merchant_wallet_address" name="team556_pay_settings[merchant_wallet_address]" value="<?php echo esc_attr($options['merchant_wallet_address'] ?? ''); ?>" class="regular-text">
                            <p class="description"><?php _e('Enter your Solana wallet address where you will receive Team556 token payments.', 'team556-pay'); ?></p>
                        </div>
                        
                        <!-- Solana Network field removed - hardcoded to mainnet -->


                        <div class="form-group form-group-checkbox">
                            <label for="enable_max_order_total">
                                <input type="checkbox" id="enable_max_order_total" name="team556_pay_settings[enable_max_order_total]" value="1" <?php checked($options['enable_max_order_total'] ?? 0, 1); ?>>
                                <?php _e('Enable Maximum Order Total Limit', 'team556-pay'); ?>
                            </label>
                            <p class="description"><?php _e('If checked, Team556 Pay will be unavailable for orders exceeding the amount specified below.', 'team556-pay'); ?></p>
                        </div>

                        <div class="form-group">
                            <label for="max_order_total"><?php _e('Maximum Order Total Amount', 'team556-pay'); ?></label>
                            <input type="number" step="0.01" min="0" id="max_order_total" name="team556_pay_settings[max_order_total]" value="<?php echo esc_attr($options['max_order_total'] ?? ''); ?>" placeholder="<?php echo esc_attr(wc_format_localized_price(0)); ?>" class="regular-text">
                            <p class="description"><?php _e('Enter the maximum order total. This is only active if the checkbox above is enabled.', 'team556-pay'); ?></p>
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