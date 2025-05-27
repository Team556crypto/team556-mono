<?php
/**
 * Team556 Solana Pay Database Class
 * Handles database operations for the plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Database Class
 */
class Team556_Solana_Pay_DB {
    /**
     * Transactions table name
     *
     * @var string
     */
    private $transactions_table;

    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        $this->transactions_table = $wpdb->prefix . 'team556_solana_transactions';
    }

    /**
     * Create database tables
     *
     * @return void
     */
    public function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE {$this->transactions_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            transaction_signature varchar(255) NOT NULL,
            wallet_address varchar(255) NOT NULL,
            amount decimal(18,8) NOT NULL DEFAULT 0,
            order_id bigint(20) unsigned DEFAULT NULL,
            status varchar(50) NOT NULL DEFAULT 'pending',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT NULL,
            metadata longtext DEFAULT NULL,
            PRIMARY KEY (id),
            KEY transaction_signature (transaction_signature),
            KEY wallet_address (wallet_address),
            KEY order_id (order_id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Log a transaction
     *
     * @param array $data Transaction data
     * @return int|false The number of rows inserted, or false on error
     */
    public function log_transaction($data) {
        global $wpdb;
        
        $defaults = array(
            'transaction_signature' => '',
            'wallet_address'        => '',
            'amount'                => 0,
            'order_id'              => null,
            'status'                => 'pending',
            'created_at'            => current_time('mysql'),
            'metadata'              => null,
        );
        
        $data = wp_parse_args($data, $defaults);
        
        // Serialize metadata if it's an array
        if (is_array($data['metadata'])) {
            $data['metadata'] = maybe_serialize($data['metadata']);
        }
        
        $result = $wpdb->insert($this->transactions_table, $data);
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }

    /**
     * Update a transaction
     *
     * @param int   $id   Transaction ID
     * @param array $data Transaction data
     * @return int|false The number of rows updated, or false on error
     */
    public function update_transaction($id, $data) {
        global $wpdb;
        
        // Set updated_at timestamp
        $data['updated_at'] = current_time('mysql');
        
        // Serialize metadata if it's an array
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = maybe_serialize($data['metadata']);
        }
        
        return $wpdb->update(
            $this->transactions_table,
            $data,
            array('id' => $id)
        );
    }

    /**
     * Get a transaction by ID
     *
     * @param int $id Transaction ID
     * @return object|null Transaction object or null if not found
     */
    public function get_transaction($id) {
        global $wpdb;
        
        $transaction = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->transactions_table} WHERE id = %d", $id)
        );
        
        if ($transaction && !empty($transaction->metadata)) {
            $transaction->metadata = maybe_unserialize($transaction->metadata);
        }
        
        return $transaction;
    }

    /**
     * Get a transaction by signature
     *
     * @param string $signature Transaction signature
     * @return object|null Transaction object or null if not found
     */
    public function get_transaction_by_signature($signature) {
        global $wpdb;
        
        $transaction = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->transactions_table} WHERE transaction_signature = %s", $signature)
        );
        
        if ($transaction && !empty($transaction->metadata)) {
            $transaction->metadata = maybe_unserialize($transaction->metadata);
        }
        
        return $transaction;
    }

    /**
     * Get transactions
     *
     * @param array $args Query arguments
     * @return array Array of transaction objects
     */
    public function get_transactions($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'number'         => 20,
            'offset'         => 0,
            'orderby'        => 'id',
            'order'          => 'DESC',
            'status'         => '',
            'wallet_address' => '',
            'order_id'       => null,
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $sql = "SELECT * FROM {$this->transactions_table}";
        $where = array();
        
        // Add status filter
        if (!empty($args['status'])) {
            $where[] = $wpdb->prepare("status = %s", $args['status']);
        }
        
        // Add wallet address filter
        if (!empty($args['wallet_address'])) {
            $where[] = $wpdb->prepare("wallet_address = %s", $args['wallet_address']);
        }
        
        // Add order ID filter
        if (!is_null($args['order_id'])) {
            $where[] = $wpdb->prepare("order_id = %d", $args['order_id']);
        }
        
        // Build where clause
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        
        // Add order by
        $sql .= " ORDER BY {$args['orderby']} {$args['order']}";
        
        // Add limit
        $sql .= $wpdb->prepare(" LIMIT %d, %d", $args['offset'], $args['number']);
        
        $transactions = $wpdb->get_results($sql);
        
        // Unserialize metadata
        foreach ($transactions as $transaction) {
            if (!empty($transaction->metadata)) {
                $transaction->metadata = maybe_unserialize($transaction->metadata);
            }
        }
        
        return $transactions;
    }

    /**
     * Count transactions
     *
     * @param array $args Query arguments
     * @return int Number of transactions
     */
    public function count_transactions($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'status'         => '',
            'wallet_address' => '',
            'order_id'       => null,
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $sql = "SELECT COUNT(*) FROM {$this->transactions_table}";
        $where = array();
        
        // Add status filter
        if (!empty($args['status'])) {
            $where[] = $wpdb->prepare("status = %s", $args['status']);
        }
        
        // Add wallet address filter
        if (!empty($args['wallet_address'])) {
            $where[] = $wpdb->prepare("wallet_address = %s", $args['wallet_address']);
        }
        
        // Add order ID filter
        if (!is_null($args['order_id'])) {
            $where[] = $wpdb->prepare("order_id = %d", $args['order_id']);
        }
        
        // Build where clause
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        
        return $wpdb->get_var($sql);
    }

    /**
     * Delete a transaction
     *
     * @param int $id Transaction ID
     * @return int|false The number of rows deleted, or false on error
     */
    public function delete_transaction($id) {
        global $wpdb;
        
        return $wpdb->delete(
            $this->transactions_table,
            array('id' => $id),
            array('%d')
        );
    }
} 