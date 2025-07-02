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
            'ajax'     => false
        ]);
        $this->db = new Team556_Pay_DB();
    }

    public function get_columns() {
        return [
            'cb'                    => '<input type="checkbox" />',
            'id'                    => __('ID', 'team556-pay'),
            'order_id'              => __('Order', 'team556-pay'),
            'customer'              => __('Customer', 'team556-pay'),
            'order_total'           => __('Order Total', 'team556-pay'),
            'amount'                => __('TEAM556 Amount', 'team556-pay'),
            'transaction_signature' => __('Solana Signature', 'team556-pay'),
            'status'                => __('Status', 'team556-pay'),
            'created_at'            => __('Date', 'team556-pay'),
        ];
    }

    protected function get_sortable_columns() {
        return [
            'id'         => ['id', false],
            'order_id'   => ['order_id', false],
            'customer'   => ['customer', false],
            'amount'     => ['amount', false],
            'status'     => ['status', false],
            'created_at' => ['created_at', true]
        ];
    }

    protected function column_default($item, $column_name) {
        switch ($column_name) {
            case 'id':
            case 'amount':
            case 'created_at':
                return esc_html($item->$column_name);
            default:
                return '';
        }
    }

    protected function column_cb($item) {
        return sprintf('<input type="checkbox" name="transactions[]" value="%s" />', $item->id);
    }

    protected function column_order_id($item) {
        if (empty($item->order_id)) {
            return __('N/A', 'team556-pay');
        }
        $order_url = admin_url('post.php?post=' . intval($item->order_id) . '&action=edit');
        $output = sprintf('<a href="%s" target="_blank">#%s</a>', esc_url($order_url), esc_html($item->order_id));
        if (function_exists('wc_get_order') && ($order = wc_get_order($item->order_id))) {
            $output .= '<div class="row-actions"><a href="' . esc_url($order_url) . '" target="_blank">' . __('View Order', 'team556-pay') . '</a></div>';
        }
        return $output;
    }

    protected function column_order_total($item) {
        if ($item->order_id && function_exists('wc_get_order') && ($order = wc_get_order($item->order_id))) {
            return wp_kses_post($order->get_formatted_order_total());
        }
        return __('N/A', 'team556-pay');
    }

    protected function column_customer($item) {
        if (!empty($item->billing_first_name) || !empty($item->billing_last_name)) {
            $name = trim($item->billing_first_name . ' ' . $item->billing_last_name);
            return esc_html($name);
        }
        if ($item->order_id) {
            $order = wc_get_order($item->order_id);
            if ($order) {
                return esc_html($order->get_formatted_billing_full_name());
            }
        }
        return __('Guest or N/A', 'team556-pay');
    }

    protected function column_transaction_signature($item) {
        if (!empty($item->transaction_signature)) {
            $url = sprintf('https://solscan.io/tx/%s', esc_attr($item->transaction_signature));
            $short_sig = substr($item->transaction_signature, 0, 8) . '...' . substr($item->transaction_signature, -8);
            return sprintf('<a href="%s" target="_blank" title="%s">%s</a>', esc_url($url), esc_attr($item->transaction_signature), esc_html($short_sig));
        }
        return __('N/A', 'team556-pay');
    }

    protected function column_status($item) {
        return !empty($item->status) ? esc_html(ucfirst($item->status)) : __('N/A', 'team556-pay');
    }

    public function prepare_items() {
        $this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns()];
        $per_page = $this->get_items_per_page('transactions_per_page', 20);
        $current_page = $this->get_pagenum();
        $search_term = !empty($_REQUEST['s']) ? sanitize_text_field($_REQUEST['s']) : '';

        $query_args = ['search' => $search_term];
        $total_items = $this->db->count_transactions($query_args);

        $this->set_pagination_args([
            'total_items' => $total_items,
            'per_page'    => $per_page
        ]);

        $get_args = [
            'number'  => $per_page,
            'offset'  => ($current_page - 1) * $per_page,
            'orderby' => sanitize_sql_orderby(isset($_GET['orderby']) ? $_GET['orderby'] : 'created_at'),
            'order'   => isset($_GET['order']) && in_array(strtoupper($_GET['order']), ['ASC', 'DESC']) ? $_GET['order'] : 'DESC',
            'search'  => $search_term,
        ];
        $this->items = $this->db->get_transactions($get_args);
    }
}
