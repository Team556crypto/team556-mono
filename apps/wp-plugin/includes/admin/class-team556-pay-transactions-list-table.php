<?php

if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Team556_Pay_Transactions_List_Table extends WP_List_Table {

    private $db;

    public function __construct() {
        parent::__construct([
            'singular' => __('Transaction', 'team556-pay'),
            'plural'   => __('Transactions', 'team556-pay'),
            'ajax'     => false // true if you want to handle AJAX pagination/sorting
        ]);
        $this->db = new Team556_Pay_DB();
    }

    /**
     * Get columns.
     *
     * @return array
     */
    public function get_columns() {
        $columns = [
            'cb'            => '<input type="checkbox" />',
            'order_id'      => __('Order ID', 'team556-pay'),
            'amount'        => __('Token Amount', 'team556-pay'),
            'fiat_amount'   => __('USD Amount', 'team556-pay'),
            'wallet_address'=> __('Sender Wallet', 'team556-pay'),
            'customer_name' => __('Customer', 'team556-pay'),
            'currency'      => __('Currency', 'team556-pay'),
            'status'        => __('Status', 'team556-pay'),
            'signature'     => __('Solana Signature', 'team556-pay'),
            'created_at'    => __('Date', 'team556-pay'),
            'wc_order_link' => __('WooCommerce Order', 'team556-pay'),
        ];
        return $columns;
    }

    /**
     * Sortable columns.
     *
     * @return array
     */
    protected function get_sortable_columns() {
        $sortable_columns = [
            'order_id'   => ['order_id', false],
            'fiat_amount'=> ['fiat_amount', false],
            'amount'     => ['amount', false],
            'status'     => ['status', false],
            'created_at' => ['created_at', true] // True for default sort
        ];
        return $sortable_columns;
    }

    /**
     * Default column values.
     *
     * @param object $item
     * @param string $column_name
     * @return mixed
     */
    protected function column_default($item, $column_name) {
        switch ($column_name) {
            case 'order_id':
            case 'amount':
            case 'wallet_address':
            case 'fiat_amount':
            case 'customer_name':
            case 'currency':
            case 'status':
            case 'signature':
            case 'created_at':
                return esc_html($item->$column_name);
            default:
                return print_r($item, true); //Show the whole array for troubleshooting purposes
        }
    }

    /**
     * Checkbox column.
     *
     * @param object $item
     * @return string
     */
    protected function column_cb($item) {
        return sprintf(
            '<input type="checkbox" name="transaction_id[]" value="%s" />',
            $item->id
        );
    }
    
    /**
     * Column for Order ID, making it linkable if possible.
     */
    protected function column_order_id($item) {
        $actions = [];
        if ($item->order_id && intval($item->order_id) > 0) {
            $order_url = admin_url('post.php?post=' . intval($item->order_id) . '&action=edit');
            $actions['view_wc_order'] = sprintf('<a href="%s">%s</a>', esc_url($order_url), __('View WC Order', 'team556-pay'));
            return sprintf('%1$s %2$s', esc_html($item->order_id), $this->row_actions($actions));
        } 
        return esc_html($item->order_id ?: __('N/A', 'team556-pay'));
    }

    /**
     * Column for Solana Signature, making it linkable to explorer.
     */
    protected function column_signature($item) {
        // Try DB field first
        $sig = $item->signature;
        // Fallback to order meta if empty
        if (empty($sig) && $item->order_id) {
            $order = wc_get_order($item->order_id);
            if ($order) {
                $sig = $order->get_meta('_team556_transaction_signature');
            }
        }
        if (!empty($sig)) {
            $network = get_option('team556_solana_pay_network', 'mainnet');
            $explorer_url = 'https://explorer.solana.com/tx/' . esc_attr($sig);
            if ('devnet' === $network) {
                $explorer_url .= '?cluster=devnet';
            } elseif ('testnet' === $network) {
                $explorer_url .= '?cluster=testnet';
            }
            return sprintf('<a href="%s" target="_blank" title="%s">%s…%s</a>',
                esc_url($explorer_url),
                esc_attr($sig),
                esc_html(substr($sig, 0, 8)),
                esc_html(substr($sig, -8))
            );
        }
        return __('N/A', 'team556-pay');
    }


    /**
     * Column for Sender Wallet address.
     */
    protected function column_wallet_address($item) {
        if (!empty($item->wallet_address)) {
            return esc_html($item->wallet_address);
        }
        return __('N/A', 'team556-pay');
    }

    /**
     * Column for USD amount derived from WC order.
     */
    protected function column_fiat_amount($item) {
        if ($item->order_id) {
            $order = wc_get_order($item->order_id);
            if ($order) {
                return wc_price($order->get_total());
            }
        }
        return __('N/A', 'team556-pay');
    }

    /**
     * Column for customer name from WC order.
     */
    protected function column_customer_name($item) {
        if ($item->order_id) {
            $order = wc_get_order($item->order_id);
            if ($order) {
                $name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
                if (!empty($name)) {
                    return esc_html($name);
                }
            }
        }
        return __('N/A', 'team556-pay');
    }

    /**
     * Column for WooCommerce Order Link.
     */
    protected function column_wc_order_link($item) {
        if ($item->order_id && intval($item->order_id) > 0) {
            $order_url = admin_url('post.php?post=' . intval($item->order_id) . '&action=edit');
            return sprintf('<a href="%s" class="button button-small" target="_blank">%s %s</a>', 
                esc_url($order_url), 
                '<span class="dashicons dashicons-external"></span>',
                __('View Order', 'team556-pay')
            );
        }
        return __('N/A', 'team556-pay');
    }

    /**
     * Prepare items for the table.
     */
    public function prepare_items() {
        $this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns()];

        $per_page = $this->get_items_per_page('transactions_per_page', 20);
        $current_page = $this->get_pagenum();
        $total_items = $this->db->count_transactions(); // You might need to pass search/filter params here

        $this->set_pagination_args([
            'total_items' => $total_items,
            'per_page'    => $per_page
        ]);

        $args = [
            'number'  => $per_page,
            'offset'  => ($current_page - 1) * $per_page,
            'orderby' => sanitize_sql_orderby(isset($_GET['orderby']) ? $_GET['orderby'] : 'created_at'),
            'order'   => isset($_GET['order']) && in_array(strtoupper($_GET['order']), ['ASC', 'DESC']) ? $_GET['order'] : 'DESC',
        ];

        // Handle search
        if (!empty($_REQUEST['s'])) {
            $args['search'] = sanitize_text_field($_REQUEST['s']);
            // Adjust total_items count if search is applied
            // This might require a separate count method in Team556_Pay_DB that accepts search terms
            // For now, pagination might be inaccurate with search until $db->count_transactions($args) is implemented.
        }

        $this->items = $this->db->get_transactions($args);
    }

    /**
     *  Associative array of columns
     *
     * @return array
     */
    function get_bulk_actions() {
        $actions = [
            // 'bulk-delete' => 'Delete' // Example, if you implement bulk actions
        ];
        return $actions;
    }

    /**
     * Displays the search box.
     *
     * @param string $text     The 'submit' button label.
     * @param string $input_id ID attribute value for the search input field.
     */
    public function search_box( $text, $input_id ) {
        if ( empty( $_REQUEST['s'] ) && ! $this->has_items() ) {
            return;
        }

        $input_id = $input_id . '-search-input';

        if ( ! empty( $_REQUEST['orderby'] ) ) {
            echo '<input type="hidden" name="orderby" value="' . esc_attr( $_REQUEST['orderby'] ) . '" />';
        }
        if ( ! empty( $_REQUEST['order'] ) ) {
            echo '<input type="hidden" name="order" value="' . esc_attr( $_REQUEST['order'] ) . '" />';
        }
        if ( ! empty( $_REQUEST['post_mime_type'] ) ) {
            echo '<input type="hidden" name="post_mime_type" value="' . esc_attr( $_REQUEST['post_mime_type'] ) . '" />';
        }
        if ( ! empty( $_REQUEST['detached'] ) ) {
            echo '<input type="hidden" name="detached" value="' . esc_attr( $_REQUEST['detached'] ) . '" />';
        }
        ?>
        <p class="search-box">
            <label class="screen-reader-text" for="<?php echo esc_attr( $input_id ); ?>"><?php echo esc_html( $text ); ?>:</label>
            <input type="search" id="<?php echo esc_attr( $input_id ); ?>" name="s" value="<?php _admin_search_query(); ?>" />
            <?php submit_button( $text, '', '', false, array( 'id' => 'search-submit' ) ); ?>
        </p>
        <?php
    }
}
