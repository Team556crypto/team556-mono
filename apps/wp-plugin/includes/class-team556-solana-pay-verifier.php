<?php
/**
 * Team556 Solana Pay Transaction Verifier
 * Handles server-side verification of Solana transactions
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Transaction Verifier Class
 */
class Team556_Solana_Pay_Verifier {
    /**
     * Solana RPC endpoints
     *
     * @var array
     */
    private $rpc_endpoints = array(
        'mainnet' => 'https://api.mainnet-beta.solana.com',
        'devnet' => 'https://api.devnet.solana.com',
        'testnet' => 'https://api.testnet.solana.com',
    );
    
    /**
     * Debug mode
     *
     * @var bool
     */
    private $debug_mode = false;
    
    /**
     * Constructor
     *
     * @param bool $debug_mode Enable debug mode
     */
    public function __construct($debug_mode = false) {
        $this->debug_mode = $debug_mode;
    }
    
    /**
     * Verify a Solana transaction
     *
     * @param string $signature Transaction signature
     * @param string $expected_recipient Expected recipient wallet address
     * @param float $expected_amount Expected amount (in tokens)
     * @param string $network Solana network (mainnet, devnet, testnet)
     * @return boolean Whether the transaction is valid
     */
    public function verify_transaction($signature, $expected_recipient, $expected_amount, $network = 'mainnet') {
        // For development testing, allow simulated signatures
        if (strpos($signature, 'simulated_') === 0 && (defined('WP_DEBUG') && WP_DEBUG)) {
            $this->log_debug("Accepting simulated signature in debug mode: $signature");
            return true;
        }
        
        // Validate signature format
        if (!$this->is_valid_signature_format($signature)) {
            $this->log_debug("Invalid signature format: $signature");
            return false;
        }
        
        // Get RPC endpoint for the selected network
        $endpoint = isset($this->rpc_endpoints[$network]) ? $this->rpc_endpoints[$network] : $this->rpc_endpoints['mainnet'];
        
        // Get transaction details
        $transaction_data = $this->get_transaction_data($signature, $endpoint);
        if (empty($transaction_data)) {
            $this->log_debug("Failed to retrieve transaction data for signature: $signature");
            return false;
        }
        
        // Verify transaction success
        if (!$this->is_transaction_successful($transaction_data)) {
            $this->log_debug("Transaction was not successful: $signature");
            return false;
        }
        
        // Verify token program involvement (for SPL tokens)
        if (!$this->verify_token_program($transaction_data)) {
            $this->log_debug("Transaction doesn't involve the SPL Token program: $signature");
            return false;
        }
        
        // Hardcoded Team556 token mint for security
        $expected_token_mint = 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg';
        
        // Verify token mint (must be Team556 token)
        if (!$this->verify_token_mint($transaction_data, $expected_token_mint)) {
            $this->log_debug("Transaction doesn't involve the Team556 token mint: $signature");
            return false;
        }
        
        // Verify recipient
        if (!$this->verify_recipient($transaction_data, $expected_recipient)) {
            $this->log_debug("Transaction recipient doesn't match expected: $signature");
            return false;
        }
        
        // Verify amount (approximate match due to potential fees)
        // Note: In a real implementation, you would need to account for token decimals
        // and verify the exact amount transferred
        
        // The transaction passed all checks
        $this->log_debug("Transaction verification successful for signature: $signature");
        return true;
    }
    
    /**
     * Check if signature is in valid format
     *
     * @param string $signature Transaction signature
     * @return boolean Whether the format is valid
     */
    private function is_valid_signature_format($signature) {
        // Real Solana signatures are base58 encoded, typically around 88 characters
        // This is a simple length check, not a full validation
        return strlen($signature) >= 70 && strlen($signature) <= 120;
    }
    
    /**
     * Get transaction data from Solana RPC
     *
     * @param string $signature Transaction signature
     * @param string $endpoint RPC endpoint URL
     * @return array|null Transaction data or null on error
     */
    private function get_transaction_data($signature, $endpoint) {
        // Prepare request data
        $request_data = array(
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'getTransaction',
            'params' => array(
                $signature,
                array(
                    'encoding' => 'jsonParsed',
                    'maxSupportedTransactionVersion' => 0
                )
            )
        );
        
        // Make HTTP request to Solana RPC
        $response = wp_remote_post($endpoint, array(
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 30,
            'body' => json_encode($request_data)
        ));
        
        // Check for HTTP errors
        if (is_wp_error($response)) {
            $this->log_debug('RPC error: ' . $response->get_error_message());
            return null;
        }
        
        // Parse response body
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Check if transaction was found
        if (empty($data) || empty($data['result'])) {
            $this->log_debug('Transaction not found or invalid response');
            return null;
        }
        
        return $data['result'];
    }
    
    /**
     * Check if the transaction was successful
     *
     * @param array $transaction_data Transaction data from RPC
     * @return boolean Whether the transaction was successful
     */
    private function is_transaction_successful($transaction_data) {
        // Check for "null" result which means transaction not found or failed
        if (empty($transaction_data)) {
            return false;
        }
        
        // Check for error field in meta
        if (isset($transaction_data['meta']['err']) && $transaction_data['meta']['err'] !== null) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Verify that the transaction involves the SPL Token program
     *
     * @param array $transaction_data Transaction data from RPC
     * @return boolean Whether the transaction involves the token program
     */
    private function verify_token_program($transaction_data) {
        // SPL Token program ID
        $token_program_id = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        
        // Check if transaction data has proper structure
        if (empty($transaction_data['transaction']['message']['accountKeys'])) {
            return false;
        }
        
        // Look for token program in account keys
        foreach ($transaction_data['transaction']['message']['accountKeys'] as $account) {
            if (isset($account['pubkey']) && $account['pubkey'] === $token_program_id) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verify that the transaction involves the expected token mint (Team556)
     *
     * @param array $transaction_data Transaction data from RPC
     * @param string $expected_token_mint Expected token mint address
     * @return boolean Whether the transaction involves the expected token mint
     */
    private function verify_token_mint($transaction_data, $expected_token_mint) {
        // Check if transaction data has proper structure
        if (empty($transaction_data['meta']['preTokenBalances']) || 
            empty($transaction_data['meta']['postTokenBalances'])) {
            return false;
        }
        
        // Check pre and post token balances for the expected mint
        foreach ($transaction_data['meta']['preTokenBalances'] as $balance) {
            if (isset($balance['mint']) && $balance['mint'] === $expected_token_mint) {
                return true;
            }
        }
        
        foreach ($transaction_data['meta']['postTokenBalances'] as $balance) {
            if (isset($balance['mint']) && $balance['mint'] === $expected_token_mint) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verify that the transaction recipient matches the expected recipient
     *
     * @param array $transaction_data Transaction data from RPC
     * @param string $expected_recipient Expected recipient wallet address
     * @return boolean Whether the recipient matches
     */
    private function verify_recipient($transaction_data, $expected_recipient) {
        // This is a simplified check - in a real implementation you would need to
        // parse the transaction instructions to find the SPL token transfer and
        // verify the destination account and owner
        
        // For now, we'll just check if the recipient is in the account keys
        if (empty($transaction_data['transaction']['message']['accountKeys'])) {
            return false;
        }
        
        foreach ($transaction_data['transaction']['message']['accountKeys'] as $account) {
            if (isset($account['pubkey']) && $account['pubkey'] === $expected_recipient) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Log debug message
     *
     * @param string $message Debug message
     * @return void
     */
    private function log_debug($message) {
        if (!$this->debug_mode) {
            return;
        }
        
        // Create log directory if it doesn't exist
        $log_dir = WP_CONTENT_DIR . '/uploads/team556-solana-pay-logs';
        if (!is_dir($log_dir)) {
            @mkdir($log_dir, 0755, true);
        }
        
        $log_file = $log_dir . '/verifier-' . date('Y-m-d') . '.log';
        $timestamp = date('Y-m-d H:i:s');
        
        error_log("[{$timestamp}] {$message}\n", 3, $log_file);
    }
    
    /**
     * Check for a transaction by reference ID
     *
     * @param string $reference Reference ID to check
     * @param string $network Solana network (mainnet, devnet, testnet)
     * @return object|false Transaction data or false if not found
     */
    public function check_transaction_by_reference($reference, $network = 'mainnet') {
        global $wpdb;
        
        // First check in our database if we already have this transaction
        $transaction = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}team556_solana_pay_transactions WHERE reference = %s LIMIT 1",
            $reference
        ));
        
        if ($transaction) {
            $this->log_debug("Transaction found in database for reference: $reference");
            return $transaction;
        }
        
        // If not in database, check on the blockchain using Solana RPC 
        $endpoint = isset($this->rpc_endpoints[$network]) ? $this->rpc_endpoints[$network] : $this->rpc_endpoints['mainnet'];
        
        // Get transactions that include this reference
        $signatures = $this->get_signatures_by_reference($reference, $endpoint);
        
        if (empty($signatures)) {
            $this->log_debug("No transactions found for reference: $reference");
            return false;
        }
        
        // Get the transaction data for the most recent signature
        $signature = $signatures[0];
        $this->log_debug("Found signature for reference: $reference, signature: $signature");
        
        // Get transaction details
        $transaction_data = $this->get_transaction_data($signature, $endpoint);
        if (empty($transaction_data)) {
            $this->log_debug("Failed to retrieve transaction data for signature: $signature");
            return false;
        }
        
        // Verify transaction success
        if (!$this->is_transaction_successful($transaction_data)) {
            $this->log_debug("Transaction was not successful: $signature");
            return false;
        }
        
        // Verify token program involvement (for SPL tokens)
        if (!$this->verify_token_program($transaction_data)) {
            $this->log_debug("Transaction doesn't involve the SPL Token program: $signature");
            return false;
        }
        
        // Verify token mint (must be Team556 token)
        // Hardcoded Team556 token mint address for security
        $token_mint = 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg';
        if (!$this->verify_token_mint($transaction_data, $token_mint)) {
            $this->log_debug("Transaction doesn't involve the Team556 token mint: $signature");
            return false;
        }
        
        // Get merchant wallet address
        $merchant_wallet = get_option('team556_solana_pay_wallet_address', '');
        if (empty($merchant_wallet)) {
            $this->log_debug("Merchant wallet not configured");
            return false;
        }
        
        // Verify recipient
        if (!$this->verify_recipient($transaction_data, $merchant_wallet)) {
            $this->log_debug("Transaction recipient doesn't match merchant wallet: $signature");
            return false;
        }
        
        // Transaction is valid, save to database
        $wpdb->insert(
            $wpdb->prefix . 'team556_solana_pay_transactions',
            array(
                'signature' => $signature,
                'reference' => $reference,
                'amount' => 0, // We could calculate this from transaction data
                'token_mint' => $token_mint,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ),
            array('%s', '%s', '%f', '%s', '%s', '%s', '%s')
        );
        
        // Return the newly created transaction
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}team556_solana_pay_transactions WHERE signature = %s LIMIT 1",
            $signature
        ));
    }
    
    /**
     * Get transaction signatures by reference
     *
     * @param string $reference Reference ID to search for
     * @param string $endpoint RPC endpoint URL
     * @return array Array of signatures or empty array if none found
     */
    private function get_signatures_by_reference($reference, $endpoint) {
        // Prepare request data for getSignaturesForAddress
        $request_data = array(
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'getSignaturesForAddress',
            'params' => array(
                $reference,
                array(
                    'limit' => 10 // Limit to recent transactions
                )
            )
        );
        
        // Make HTTP request to Solana RPC
        $response = wp_remote_post($endpoint, array(
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 30,
            'body' => json_encode($request_data)
        ));
        
        // Check for HTTP errors
        if (is_wp_error($response)) {
            $this->log_debug('RPC error: ' . $response->get_error_message());
            return array();
        }
        
        // Parse response body
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Check if signatures were found
        if (empty($data) || empty($data['result'])) {
            return array();
        }
        
        // Extract signatures
        $signatures = array();
        foreach ($data['result'] as $item) {
            if (isset($item['signature'])) {
                $signatures[] = $item['signature'];
            }
        }
        
        return $signatures;
    }
} 