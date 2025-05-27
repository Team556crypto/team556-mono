<?php
// Exit if not called by WordPress
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Get global wpdb object
global $wpdb;

// Delete plugin tables
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}team556_solana_transactions");

// Delete plugin options
delete_option('team556_solana_pay_version');
delete_option('team556_solana_pay_wallet_address');
delete_option('team556_solana_pay_token_mint');
delete_option('team556_solana_pay_network');
delete_option('team556_solana_pay_button_text');
delete_option('team556_solana_pay_button_color');
delete_option('team556_solana_pay_success_message');
delete_option('team556_solana_pay_error_message');
delete_option('team556_solana_pay_debug_mode');
delete_option('team556_solana_pay_confirmation_blocks');

// Clear any custom user capabilities
$roles = wp_roles();
if (!empty($roles)) {
    foreach ($roles->role_objects as $role) {
        if ($role->has_cap('manage_team556_solana_pay')) {
            $role->remove_cap('manage_team556_solana_pay');
        }
    }
}

// Remove scheduled events
wp_clear_scheduled_hook('team556_solana_pay_check_pending_transactions'); 