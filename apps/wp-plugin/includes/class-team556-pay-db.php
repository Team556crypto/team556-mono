<?php
/**
 * Team556 Pay Database Class
 * Handles database operations for the plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Database Class
 */
class Team556_Pay_DB {
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
        $this->transactions_table = $wpdb->prefix . 'team556_transactions';
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
            KEY transaction_signature (transaction_signature(191)),
            KEY wallet_address (wallet_address(191)),
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
        if (!$result) {
            // Log database error to WooCommerce log system
            if (function_exists('wc_get_logger')) {
                $logger  = wc_get_logger();
                $context = array( 'source' => 'team556-pay' );
                $logger->error( 'DB insert failed: ' . $wpdb->last_error . ' | Data: ' . wp_json_encode( $data ), $context );
            }
        }
        return $result ? $wpdb->insert_id : false;
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
            'number'   => 20,
            'offset'   => 0,
            'orderby'  => 'id',
            'order'    => 'DESC',
            'status'   => '',
            'order_id' => null,
            'search'   => '',
        );

        $args = wp_parse_args($args, $defaults);

        // Whitelist orderby to prevent SQL injection
        $allowed_orderby = ['id', 'amount', 'status', 'created_at', 'order_id', 'customer'];
        $orderby_key = in_array($args['orderby'], $allowed_orderby) ? $args['orderby'] : 'id';
        
        // Map public keys to actual DB columns for sorting
        $orderby_map = [
            'id'         => 't.id',
            'amount'     => 't.amount',
            'status'     => 't.status',
            'created_at' => 't.created_at',
            'order_id'   => 't.order_id',
            'customer'   => 'pm_lname.meta_value',
        ];
        $orderby = $orderby_map[$orderby_key];
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $sql = "SELECT t.*, 
                       pm_fname.meta_value as billing_first_name, 
                       pm_lname.meta_value as billing_last_name
                FROM {$this->transactions_table} t 
                LEFT JOIN {$wpdb->posts} p ON t.order_id = p.ID AND p.post_type = 'shop_order'
                LEFT JOIN {$wpdb->postmeta} pm_fname ON p.ID = pm_fname.post_id AND pm_fname.meta_key = '_billing_first_name'
                LEFT JOIN {$wpdb->postmeta} pm_lname ON p.ID = pm_lname.post_id AND pm_lname.meta_key = '_billing_last_name'";
        
        $where = array();
        $params = array();

        if (!empty($args['search'])) {
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $where[] = "(t.transaction_signature LIKE %s OR t.order_id LIKE %s OR t.id LIKE %s OR CONCAT(pm_fname.meta_value, ' ', pm_lname.meta_value) LIKE %s)";
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
        }

        if (!empty($args['status'])) {
            $where[] = "t.status = %s";
            $params[] = $args['status'];
        }

        if (!is_null($args['order_id'])) {
            $where[] = "t.order_id = %d";
            $params[] = $args['order_id'];
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= " ORDER BY {$orderby} {$order}, t.id DESC";

        $sql .= " LIMIT %d, %d";
        $params[] = $args['offset'];
        $params[] = $args['number'];

        $transactions = $wpdb->get_results($wpdb->prepare($sql, $params));

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
            'status'   => '',
            'order_id' => null,
            'search'   => '',
        );

        $args = wp_parse_args($args, $defaults);

        $sql = "SELECT COUNT(DISTINCT t.id) 
                FROM {$this->transactions_table} t 
                LEFT JOIN {$wpdb->posts} p ON t.order_id = p.ID AND p.post_type = 'shop_order'
                LEFT JOIN {$wpdb->postmeta} pm_fname ON p.ID = pm_fname.post_id AND pm_fname.meta_key = '_billing_first_name'
                LEFT JOIN {$wpdb->postmeta} pm_lname ON p.ID = pm_lname.post_id AND pm_lname.meta_key = '_billing_last_name'";
        
        $where = array();
        $params = array();

        if (!empty($args['search'])) {
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $where[] = "(t.transaction_signature LIKE %s OR t.order_id LIKE %s OR t.id LIKE %s OR CONCAT(pm_fname.meta_value, ' ', pm_lname.meta_value) LIKE %s)";
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
        }

        if (!empty($args['status'])) {
            $where[] = "t.status = %s";
            $params[] = $args['status'];
        }

        if (!is_null($args['order_id'])) {
            $where[] = "t.order_id = %d";
            $params[] = $args['order_id'];
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        return $wpdb->get_var($wpdb->prepare($sql, $params));
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