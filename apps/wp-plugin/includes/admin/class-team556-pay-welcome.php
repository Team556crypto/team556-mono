<?php
/**
 * Team556 Solana Pay Welcome Screen
 * Handles the welcome screen after activation
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Welcome Screen Class
 */
class Team556_Pay_Welcome {
    /**
     * Constructor
     */
    public function __construct() {
        // Add actions
        add_action('admin_menu', array($this, 'add_welcome_page'));
        add_action('admin_head', array($this, 'hide_welcome_page'));
        add_action('admin_init', array($this, 'redirect_to_welcome_page'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_welcome_scripts'));
    }

    /**
     * Add welcome page to menu
     */
    public function add_welcome_page() {
        // Add hidden page
        add_dashboard_page(
            __('Welcome to Team556 Pay', 'team556-pay'),
            __('Welcome to Team556 Pay', 'team556-pay'),
            'manage_options',
            'team556-pay-welcome',
            array($this, 'render_welcome_page')
        );
    }

    /**
     * Hide welcome page from menu
     */
    public function hide_welcome_page() {
        remove_submenu_page('index.php', 'team556-pay-welcome');
    }

    /**
     * Redirect to welcome page after activation
     */
    public function redirect_to_welcome_page() {
        // Check if we should show the welcome page
        if (!get_transient('team556_pay_activation_redirect')) {
            return;
        }
        
        // Delete the transient
        delete_transient('team556_pay_activation_redirect');
        
        // Bail if activating from network, or bulk
        if (is_network_admin() || isset($_GET['activate-multi'])) {
            return;
        }
        
        // Redirect to welcome page
        wp_safe_redirect(admin_url('index.php?page=team556-pay-welcome'));
        exit;
    }

    /**
     * Render welcome page
     */
    public function render_welcome_page() {
        ?>
        <div class="wrap team556-welcome-wrap team556-dark-theme-wrapper">
            
            <div class="team556-welcome-header">
                <div class="team556-welcome-logo">
                    <img src="<?php echo TEAM556_PAY_PLUGIN_URL; ?>assets/images/logo-round-dark.png" alt="Team556 Pay"> 
                </div>
                <div class="team556-welcome-intro">
                    <h1><?php _e('Welcome to Team556 Pay!', 'team556-pay'); ?></h1>
                    <p><?php _e('You\'re now ready to start accepting Team556 tokens as payment using Team556 Pay. This plugin allows your customers to pay with Team556 tokens directly from their Team556 wallet.', 'team556-pay'); ?></p>
                </div>
            </div>
            
            <div class="team556-welcome-sections">

                <div class="team556-card team556-welcome-steps-section">
                    <h2><?php _e('Getting Started in 2 Simple Steps', 'team556-pay'); ?></h2>
                    <div class="team556-steps-container">
                        <div class="team556-card team556-step-card">
                            <div class="team556-step-number">1</div>
                            <div class="team556-step-content">
                                <h3><?php _e('Configure Your Wallet', 'team556-pay'); ?></h3>
                                <p><?php _e('Add your Team556 wallet address and Team556 token mint to receive payments.', 'team556-pay'); ?></p>
                                <a href="<?php echo esc_url(admin_url('options-general.php?page=team556-pay-settings')); ?>" class="team556-button secondary"><?php _e('Configure Settings', 'team556-pay'); ?></a>
                            </div>
                        </div>
                        

                        
                        <div class="team556-card team556-step-card">
                            <div class="team556-step-number">2</div>
                            <div class="team556-step-content">
                                <h3><?php _e('Track Your Payments', 'team556-pay'); ?></h3>
                                <p><?php _e('View and manage all your transactions from the dashboard.', 'team556-pay'); ?></p>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=team556-pay')); ?>" class="team556-button secondary"><?php _e('Go to Dashboard', 'team556-pay'); ?></a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="team556-card team556-welcome-woocommerce">
                    <?php if (class_exists('WooCommerce')) : ?>
                        <h2><?php _e('WooCommerce Integration', 'team556-pay'); ?></h2>
                        <p><?php _e('Team556 Pay has been automatically integrated with WooCommerce. To configure or adjust your Team556 token payment settings:', 'team556-pay'); ?></p>
                        <ol>
                            <li><?php _e('Go to WooCommerce > Settings > Payments', 'team556-pay'); ?></li>
                            <li><?php _e('Find "Team556 Token (Team556 Pay)" in the list (it should already be enabled)', 'team556-pay'); ?></li>
                            <li><?php _e('Click "Manage" to configure additional settings if needed', 'team556-pay'); ?></li>
                        </ol>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=checkout')); ?>" class="team556-button outline"><?php _e('WooCommerce Payment Settings', 'team556-pay'); ?></a>
                    <?php else : ?>
                        <h2><?php _e('WooCommerce Integration', 'team556-pay'); ?></h2>
                        <p><?php _e('Team556 Pay can integrate with WooCommerce to provide a seamless checkout experience. If you\'re running an online store, consider installing WooCommerce to unlock additional features.', 'team556-pay'); ?></p>
                        <a href="<?php echo esc_url(admin_url('plugin-install.php?s=woocommerce&tab=search&type=term')); ?>" class="team556-button outline"><?php _e('Install WooCommerce', 'team556-pay'); ?></a>
                    <?php endif; ?>
                </div>
                
                <div class="team556-card team556-welcome-footer">
                    <h2><?php _e('Need Help?', 'team556-pay'); ?></h2>
                    <p><?php _e('Visit the Team556 documentation for more detailed guides and support.', 'team556-pay'); ?></p>
                    <a href="#" class="team556-button outline" target="_blank"><?php _e('View Documentation', 'team556-pay'); ?></a> <?php // TODO: Add actual documentation link ?>
                </div>
            </div>

        </div> <?php // .wrap ?>
        <?php
    }

    /**
     * Enqueue scripts and styles for the welcome page
     */
    public function enqueue_welcome_scripts($hook) {
        // Only enqueue on our welcome page
        if ($hook !== 'dashboard_page_team556-pay-welcome') {
            return;
        }
        
        // Enqueue admin styles
        wp_enqueue_style(
            'team556-pay-admin',
            TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-pay-admin.css',
            array(),
            TEAM556_PAY_VERSION
        );
    }
} 