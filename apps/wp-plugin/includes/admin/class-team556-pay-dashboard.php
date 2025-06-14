<?php
/**
 * Team556 Solana Pay Dashboard
 * Handles the admin dashboard for the plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Dashboard Class
 */
class Team556_Pay_Dashboard {
    /**
     * Constructor
     */
    public function __construct() {
        // Add admin menu item
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Add dashboard widgets
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widgets'));
        
        // Add admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Add body class for our pages
        add_filter('admin_body_class', array($this, 'add_admin_body_class'));
    }

    /**
     * Add admin menu item
     */
    public function add_admin_menu() {
        // Main dashboard page
        add_menu_page(
            __('Team556 Solana Pay', 'team556-pay'),
            __('Team556 Pay', 'team556-pay'),
            'manage_options',
            'team556-pay',
            array($this, 'render_dashboard_page'),
            'dashicons-money-alt',
            30
        );
        
        // Dashboard submenu
        add_submenu_page(
            'team556-pay',
            __('Dashboard', 'team556-pay'),
            __('Dashboard', 'team556-pay'),
            'manage_options',
            'team556-pay',
            array($this, 'render_dashboard_page')
        );
        
        // Transactions submenu
        add_submenu_page(
            'team556-pay',
            __('Transactions', 'team556-pay'),
            'manage_options',
            'team556-solana-pay-transactions',
            array($this, 'render_transactions_page')
        );
        
        // Settings submenu - link to the settings page in the options menu
        add_submenu_page(
            'team556-pay',
            __('Settings', 'team556-pay'),
            __('Settings', 'team556-pay'),
            'manage_options',
            'team556-pay-settings',
            array($this, 'render_settings_redirect')
        );
        
        // Help submenu
        add_submenu_page(
            'team556-pay',
            __('Help', 'team556-pay'),
            __('Help', 'team556-pay'),
            'manage_options',
            'team556-pay-help',
            array($this, 'render_help_page')
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Only enqueue on our plugin pages. 
        // The $hook variable for a top-level page is 'toplevel_page_team556-pay'.
        // For submenu pages, it's 'team556-pay_page_team556-pay-transactions', 'team556-pay_page_team556-pay-settings', etc.
        if (strpos($hook, 'team556-pay') === false) {
            return;
        }
        
        // Enqueue admin styles
        wp_enqueue_style(
            'team556-pay-admin',
            TEAM556_PAY_PLUGIN_URL . 'assets/css/team556-pay-admin.css',
            array(),
            TEAM556_PAY_VERSION
        );
        
        // Enqueue admin scripts
        wp_enqueue_script(
            'team556-pay-admin',
            TEAM556_PAY_PLUGIN_URL . 'assets/js/team556-pay-admin.js',
            array('jquery'),
            TEAM556_PAY_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('team556-pay-admin', 'team556PayAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('team556-solana-pay-admin-nonce'),
            'i18n'    => array(
                'confirmDelete' => __('Are you sure you want to delete this transaction?', 'team556-pay'),
                'deletingTransaction' => __('Deleting transaction...', 'team556-pay'),
                'transactionDeleted' => __('Transaction deleted successfully.', 'team556-pay'),
                'error' => __('An error occurred.', 'team556-pay'),
            ),
        ));
    }
    
    /**
     * Add admin body class for dark theme
     */
    public function add_admin_body_class($classes) {
        global $current_screen;
        
        // Add our class only to our plugin screens
        if (strpos($current_screen->base, 'team556-solana') !== false) {
            $classes .= ' team556-dark-theme ';
        }
        
        return $classes;
    }

    /**
     * Add dashboard widgets
     */
    public function add_dashboard_widgets() {
        // Only add for users who can manage options
        if (!current_user_can('manage_options')) {
            return;
        }
        
        wp_add_dashboard_widget(
            'team556_solana_pay_stats_widget',
            __('Team556 Solana Pay Stats', 'team556-pay'),
            array($this, 'render_dashboard_widget')
        );
    }

    /**
     * Render dashboard widget
     */
    public function render_dashboard_widget() {
        // Get transactions data
        $db = new Team556_Pay_DB();
        
        $total_transactions = $db->count_transactions();
        $successful_transactions = $db->count_transactions(array('status' => 'completed'));
        $pending_transactions = $db->count_transactions(array('status' => 'pending'));
        $failed_transactions = $db->count_transactions(array('status' => 'failed'));
        
        // Calculate success rate
        $success_rate = ($total_transactions > 0) ? ($successful_transactions / $total_transactions) * 100 : 0;
        
        // Get recent transactions
        $recent_transactions = $db->get_transactions(array(
            'number' => 5,
            'order' => 'DESC',
            'orderby' => 'created_at'
        ));
        
        // Display stats
        ?>
        <div class="team556-dark-theme-wrapper">
            <div class="team556-stats-grid">
                <div class="team556-stat-card">
                    <div class="team556-stat-value"><?php echo esc_html($total_transactions); ?></div>
                    <div class="team556-stat-label"><?php _e('Total Transactions', 'team556-pay'); ?></div>
                </div>
                
                <div class="team556-stat-card">
                    <div class="team556-stat-value"><?php echo esc_html($successful_transactions); ?></div>
                    <div class="team556-stat-label"><?php _e('Successful', 'team556-pay'); ?></div>
                </div>
                
                <div class="team556-stat-card">
                    <div class="team556-stat-value"><?php echo esc_html($pending_transactions); ?></div>
                    <div class="team556-stat-label"><?php _e('Pending', 'team556-pay'); ?></div>
                </div>
                
                <div class="team556-stat-card">
                    <div class="team556-stat-value"><?php echo round($success_rate, 1); ?>%</div>
                    <div class="team556-stat-label"><?php _e('Success Rate', 'team556-pay'); ?></div>
                </div>
            </div>
            
            <?php if (!empty($recent_transactions)) : ?>
                <h3><?php _e('Recent Transactions', 'team556-pay'); ?></h3>
                <div class="team556-transaction-list">
                    <?php foreach ($recent_transactions as $transaction) : 
                        $explorer_url = sprintf(
                            'https://explorer.solana.com/tx/%s?cluster=%s',
                            $transaction->signature,
                            get_option('team556_solana_pay_network', 'mainnet') === 'mainnet' ? 'mainnet-beta' : 'devnet'
                        );
                    ?>
                        <div class="team556-transaction-card">
                            <div class="team556-tx-main-info">
                                <div class="team556-tx-signature">
                                    <a href="<?php echo esc_url($explorer_url); ?>" target="_blank" title="<?php echo esc_attr($transaction->signature); ?>">
                                        <?php echo esc_html(substr($transaction->signature, 0, 8) . '...' . substr($transaction->signature, -8)); ?>
                                        <span class="dashicons dashicons-external"></span>
                                    </a>
                                </div>
                                <div class="team556-tx-date">
                                    <?php echo esc_html(human_time_diff(strtotime($transaction->created_at), current_time('timestamp'))) . ' ' . __('ago', 'team556-pay'); ?>
                                </div>
                            </div>
                            <div class="team556-tx-details">
                                <div class="team556-tx-amount">
                                    <?php /* TODO: Add token symbol/formatting */ ?>
                                    <?php echo esc_html($transaction->amount); ?>
                                </div>
                                <div class="team556-tx-status">
                                    <span class="team556-status team556-status-<?php echo esc_attr($transaction->status); ?>">
                                        <?php echo esc_html(ucfirst($transaction->status)); ?>
                                    </span>
                                </div>
                            </div>
                            <div class="team556-tx-extra-info">
                                 <?php if (!empty($transaction->order_id)) : ?>
                                    <div class="team556-tx-order">
                                        <?php _e('Order:', 'team556-pay'); ?> 
                                        <a href="<?php echo esc_url(admin_url('post.php?post=' . $transaction->order_id . '&action=edit')); ?>" target="_blank">
                                            #<?php echo esc_html($transaction->order_id); ?>
                                        </a>
                                    </div>
                                 <?php endif; ?>
                                 <div class="team556-tx-payer" title="<?php echo esc_attr($transaction->wallet_address); ?>">
                                    <?php _e('Payer:', 'team556-pay'); ?>
                                    <?php echo esc_html(substr($transaction->wallet_address, 0, 4) . '...' . substr($transaction->wallet_address, -4)); ?>
                                 </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <p class="team556-view-all">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=team556-solana-transactions')); ?>" class="team556-button">
                        <?php _e('View All Transactions', 'team556-pay'); ?>
                    </a>
                </p>
            <?php else : ?>
                <div class="team556-empty-state">
                    <p><?php _e('No transactions yet.', 'team556-pay'); ?></p>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        // Get DB instance
        $db = new Team556_Pay_DB();
        
        // Get stats
        $total_transactions = $db->count_transactions();
        $successful_transactions = $db->count_transactions(array('status' => 'completed'));
        $pending_transactions = $db->count_transactions(array('status' => 'pending'));
        $failed_transactions = $db->count_transactions(array('status' => 'failed'));
        
        // Calculate success rate
        // $success_rate = ($total_transactions > 0) ? ($successful_transactions / $total_transactions) * 100 : 0; // Not used for now
        
        // Get payment wallet and token settings
        $wallet_address = get_option('team556_solana_pay_wallet_address', '');
        
        // Recent transactions
        $recent_transactions = $db->get_transactions(array(
            'number' => 10,
            'order' => 'DESC',
            'orderby' => 'created_at'
        ));
        
        // Calculate total amount received
        $total_amount_raw = 0;
        foreach ($db->get_transactions(array('status' => 'completed')) as $transaction) {
            $total_amount_raw += floatval($transaction->amount);
        }
        // TODO: Add token formatting based on decimals if needed
        $total_amount_display = number_format($total_amount_raw, 2); // Basic formatting
        
        ?>
        <div class="wrap team556-admin-dashboard team556-dark-theme-wrapper">
            <h1><?php _e('Team556 Solana Pay Dashboard', 'team556-pay'); ?></h1>
            
            <div class="team556-dashboard-header team556-portfolio-card">
                <div class="team556-portfolio-info">
                    <?php if (!empty($wallet_address)) : ?>
                        <div class="team556-portfolio-wallet">
                            <span class="dashicons dashicons-admin-users team556-portfolio-icon"></span>
                            <div class="team556-portfolio-details">
                                <h2><?php _e('Merchant Wallet', 'team556-pay'); ?></h2>
                                <div class="team556-wallet-address">
                                    <?php echo esc_html(substr($wallet_address, 0, 6) . '...' . substr($wallet_address, -6)); ?>
                                    <span class="team556-clipboard-copy" data-clipboard="<?php echo esc_attr($wallet_address); ?>">
                                        <span class="dashicons dashicons-clipboard"></span>
                                    </span>
                                </div>
                                <div class="team556-wallet-network">
                                    <?php echo esc_html(ucfirst(get_option('team556_solana_pay_network', 'mainnet'))); ?>
                                </div>
                            </div>
                        </div>
                        <div class="team556-portfolio-balance">
                            <div class="team556-balance-value"><?php echo esc_html($total_amount_display); ?></div>
                            <div class="team556-balance-label"><?php _e('Total Received (Completed)', 'team556-pay'); ?></div>
                            <?php /* TODO: Potentially add token symbol here */ ?>
                        </div>
                    <?php else : ?>
                        <div class="team556-wallet-not-configured">
                            <p><?php _e('Your wallet is not configured yet.', 'team556-pay'); ?></p>
                            <a href="<?php echo esc_url(admin_url('options-general.php?page=team556-pay-settings')); ?>" class="team556-button">
                                <?php _e('Configure Now', 'team556-pay'); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
                
                <div class="team556-action-buttons">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=team556-solana-pay-transactions')); ?>" class="team556-button secondary">
                        <span class="dashicons dashicons-list-view"></span>
                        <?php _e('View All Transactions', 'team556-pay'); ?>
                    </a>
                    <a href="<?php echo esc_url(admin_url('options-general.php?page=team556-pay-settings')); ?>" class="team556-button outline">
                        <span class="dashicons dashicons-admin-settings"></span>
                        <?php _e('Settings', 'team556-pay'); ?>
                    </a>
                </div>
            </div>
            
            <div class="team556-dashboard-recent">
                <h2><?php _e('Recent Transactions', 'team556-pay'); ?></h2>
                
                <?php if (!empty($recent_transactions)) : ?>
                    <div class="team556-transaction-list"> 
                        <?php foreach ($recent_transactions as $transaction) : 
                            $explorer_url = sprintf(
                                'https://explorer.solana.com/tx/%s?cluster=%s',
                                $transaction->signature,
                                get_option('team556_solana_pay_network', 'mainnet') === 'mainnet' ? 'mainnet-beta' : 'devnet'
                            );
                        ?>
                            <div class="team556-transaction-card">
                                <div class="team556-tx-main-info">
                                    <div class="team556-tx-signature">
                                        <a href="<?php echo esc_url($explorer_url); ?>" target="_blank" title="<?php echo esc_attr($transaction->signature); ?>">
                                            <?php echo esc_html(substr($transaction->signature, 0, 8) . '...' . substr($transaction->signature, -8)); ?>
                                            <span class="dashicons dashicons-external"></span>
                                        </a>
                                    </div>
                                    <div class="team556-tx-date">
                                        <?php echo esc_html(human_time_diff(strtotime($transaction->created_at), current_time('timestamp'))) . ' ' . __('ago', 'team556-pay'); ?>
                                    </div>
                                </div>
                                <div class="team556-tx-details">
                                    <div class="team556-tx-amount">
                                        <?php /* TODO: Add token symbol/formatting */ ?>
                                        <?php echo esc_html($transaction->amount); ?>
                                    </div>
                                    <div class="team556-tx-status">
                                        <span class="team556-status team556-status-<?php echo esc_attr($transaction->status); ?>">
                                            <?php echo esc_html(ucfirst($transaction->status)); ?>
                                        </span>
                                    </div>
                                </div>
                                <div class="team556-tx-extra-info">
                                     <?php if (!empty($transaction->order_id)) : ?>
                                        <div class="team556-tx-order">
                                            <?php _e('Order:', 'team556-pay'); ?> 
                                            <a href="<?php echo esc_url(admin_url('post.php?post=' . $transaction->order_id . '&action=edit')); ?>" target="_blank">
                                                #<?php echo esc_html($transaction->order_id); ?>
                                            </a>
                                        </div>
                                     <?php endif; ?>
                                     <div class="team556-tx-payer" title="<?php echo esc_attr($transaction->wallet_address); ?>">
                                        <?php _e('Payer:', 'team556-pay'); ?>
                                        <?php echo esc_html(substr($transaction->wallet_address, 0, 4) . '...' . substr($transaction->wallet_address, -4)); ?>
                                     </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div> 
                    
                    <?php /* REMOVED View All Button - Now in header */ ?>
                    
                <?php else : ?>
                    <div class="team556-empty-state">
                        <p><?php _e('No transactions have been recorded yet.', 'team556-pay'); ?></p>
                        <p><?php _e('Once customers start making payments with Team556 tokens, you\'ll see them here.', 'team556-pay'); ?></p>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="team556-dashboard-help">
                <h2><?php _e('Getting Started', 'team556-pay'); ?></h2>
                <div class="team556-help-wrapper">
                    <div class="team556-help-step">
                        <div class="team556-step-number">1</div>
                        <div class="team556-step-content">
                            <h3><?php _e('Configure Settings', 'team556-pay'); ?></h3>
                            <p><?php _e('Enter your Solana wallet address and Team556 token details in the plugin settings.', 'team556-pay'); ?></p>
                            <a href="<?php echo esc_url(admin_url('options-general.php?page=team556-pay-settings')); ?>" class="team556-button">
                                <?php _e('Go to Settings', 'team556-pay'); ?>
                            </a>
                        </div>
                    </div>
                    
                    <div class="team556-help-step">
                        <div class="team556-step-number">2</div>
                        <div class="team556-step-content">
                            <h3><?php _e('Add Payment Buttons', 'team556-pay'); ?></h3>
                            <p><?php _e('Use the shortcode to add payment buttons to any page or post.', 'team556-pay'); ?></p>
                            <code>[team556_pay_button amount="10" label="My Product"]</code>
                        </div>
                    </div>
                    
                    <div class="team556-help-step">
                        <div class="team556-step-number">3</div>
                        <div class="team556-step-content">
                            <h3><?php _e('Enable in WooCommerce', 'team556-pay'); ?></h3>
                            <p><?php _e('If you use WooCommerce, Team556 Solana Pay has been automatically enabled. You can adjust settings in your payment methods.', 'team556-pay'); ?></p>
                            <?php if (class_exists('WooCommerce')) : ?>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=checkout')); ?>" class="team556-button">
                                    <?php _e('WooCommerce Payment Settings', 'team556-pay'); ?>
                                </a>
                            <?php else : ?>
                                <p><em><?php _e('WooCommerce is not installed or activated.', 'team556-pay'); ?></em></p>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render transactions page
     */
    public function render_transactions_page() {
        ?>
        <div class="wrap team556-admin-page team556-transactions-page">
            <h1 class="wp-heading-inline">
                <?php _e('Team556 Pay Transactions', 'team556-pay'); ?>
            </h1>

            <?php
            // Ensure the list table class is loaded
            if (!class_exists('Team556_Pay_Transactions_List_Table')) {
                require_once TEAM556_PAY_PLUGIN_DIR . 'includes/admin/class-team556-pay-transactions-list-table.php';
            }

            // Create an instance of our package class...
            $transactions_list_table = new Team556_Pay_Transactions_List_Table();

            // Fetch, prepare, sort, and filter our data...
            $transactions_list_table->prepare_items();
            ?>

            <form id="transactions-filter" method="get">
                <!-- For plugins, we also need to ensure that the form posts back to our current page -->
                <input type="hidden" name="page" value="<?php echo esc_attr($_REQUEST['page']); ?>" />
                <?php
                $transactions_list_table->search_box(__('Search Transactions', 'team556-pay'), 'search_id');
                $transactions_list_table->display();
                ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Settings redirect - redirects to the options page
     */
    public function render_settings_redirect() {
        ?>
        <script type="text/javascript">
            window.location.href = "<?php echo esc_url(admin_url('options-general.php?page=team556-pay-settings')); ?>";
        </script>
        <?php
        _e('Redirecting to settings page...', 'team556-pay');
    }
} 