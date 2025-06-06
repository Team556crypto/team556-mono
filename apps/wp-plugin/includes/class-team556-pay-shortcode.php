<?php
/**
 * Team556 Pay Shortcode Handler
 *
 * @package Team556_Pay
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Class Team556_Pay_Shortcode.
 */
class Team556_Pay_Shortcode {

    const TEAM556_DECIMALS = 9;
    const TEAM556_PRICE_API_URL = 'https://public.api.team556.com/v1/token/TEAM556/price';

    /**
     * Constructor.
     */
    public function __construct() {
        add_shortcode( 'team556_pay_button', array( $this, 'render_pay_button_shortcode' ) );
    }

    /**
     * Renders the [team556_pay_button] shortcode.
     *
     * @param array $atts Shortcode attributes.
     * @return string Shortcode output.
     */
    public function render_pay_button_shortcode( $atts ) {
        // Enqueue necessary scripts and styles
        wp_enqueue_script('team556-qrcode');
        wp_enqueue_style('team556-pay-public-style');

        $atts = shortcode_atts(
            array(
                'amount' => '', // Amount in fiat (e.g., USDC)
                'label'  => __( 'Pay with Team556', 'team556-pay' ), // For a potential button
                'memo'   => '', // Optional memo for the transaction
            ),
            $atts,
            'team556_pay_button'
        );

        if ( empty( $atts['amount'] ) || ! is_numeric( $atts['amount'] ) || $atts['amount'] <= 0 ) {
            return '<p class="team556-error">' . esc_html__( 'A valid amount attribute is required for the Team556 Pay shortcode (e.g., [team556_pay_button amount="10.00"]).', 'team556-pay' ) . '</p>';
        }
        $fiat_amount = floatval( $atts['amount'] );

        $merchant_wallet = $this->get_merchant_wallet_address();
        if ( empty( $merchant_wallet ) ) {
            return '<p class="team556-error">' . esc_html__( 'Team556 Pay merchant wallet address is not configured.', 'team556-pay' ) . '</p>';
        }

        $price_data = $this->fetch_team556_price();
        if ( ! empty( $price_data['error'] ) || empty( $price_data['price'] ) || $price_data['price'] <= 0 ) {
            $error_message = ! empty( $price_data['error'] ) ? esc_html( $price_data['error'] ) : __( 'Could not retrieve the current TEAM556 exchange rate.', 'team556-pay' );
            return '<p class="team556-error">' . $error_message . '</p>';
        }
        $team556_price_usdc = floatval( $price_data['price'] );

        $team556_amount = round( $fiat_amount / $team556_price_usdc, self::TEAM556_DECIMALS );
        if ( $team556_amount <= 0 ) {
            return '<p class="team556-error">' . esc_html__( 'Calculated TEAM556 amount is too small or invalid. Please check the amount or exchange rate.', 'team556-pay' ) . '</p>';
        }

        $reference = uniqid( 't556sc_' );
        $solana_pay_url = $this->build_solana_pay_url( $merchant_wallet, $team556_amount, $reference, $atts['label'], $atts['memo'] );

        $qr_container_id = 'team556-qr-shortcode-' . esc_attr( $reference );
        $output = '<div class="team556-pay-shortcode-container team556-adaptive">';
        $output .= '<h4>' . esc_html( $atts['label'] ) . '</h4>';
        $output .= '<div class="team556-payment-summary">';
        $output .= '<div class="team556-payment-row"><span>' . esc_html__( 'Amount:', 'team556-pay' ) . '</span><strong>' . esc_html( wc_price( $fiat_amount ) ) . '</strong></div>'; // Assuming wc_price is available
        $output .= '<div class="team556-payment-row team556-token-amount"><span>' . esc_html__( 'Team556 Amount:', 'team556-pay' ) . '</span><strong>' . esc_html( number_format_i18n( $team556_amount, self::TEAM556_DECIMALS ) ) . ' TEAM556</strong></div>';
        $output .= '</div>'; 
        $output .= '<p class="team556-scan-title">' . esc_html__( 'Scan QR or click link to pay:', 'team556-pay' ) . '</p>';
        $output .= '<div id="' . $qr_container_id . '" class="team556-qr-code-container" style="margin: 15px auto; width: 200px; height: 200px; border: 1px solid #eee; padding: 5px;"></div>';
        $output .= '<div class="team556-payment-link-container" style="margin-top: 15px; text-align: center;">';
        $output .= '<a href="' . esc_url( $solana_pay_url ) . '" class="button team556-pay-link-button">' . esc_html__( 'Pay with Solana Wallet', 'team556-pay' ) . '</a>';
        $output .= '</div>';
        $output .= '</div>';

        $output .= "<script type='text/javascript'>
            document.addEventListener('DOMContentLoaded', function() {
                var qrContainer = document.getElementById('" . esc_js( $qr_container_id ) . "');
                if (qrContainer && typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, {
                        text: '" . esc_js( $solana_pay_url ) . "',
                        width: 190,
                        height: 190,
                        correctLevel: QRCode.CorrectLevel.H
                    });
                } else if (!qrContainer) {
                    console.error('Team556 Pay: QR container not found (#" . esc_js( $qr_container_id ) . ")');
                } else {
                    console.error('Team556 Pay: QRCode library not loaded.');
                    qrContainer.innerHTML = '" . esc_js(__('QR Code library not loaded. Please ensure it is enqueued.', 'team556-pay')) . "';
                }
            });
        </script>";

        return $output;
    }

    /**
     * Get merchant wallet address from settings.
     */
    private function get_merchant_wallet_address() {
        $options = get_option( 'woocommerce_team556_pay_settings' );
        $wallet_address = ! empty( $options['wallet_address'] ) ? $options['wallet_address'] : '';

        if ( empty( $wallet_address ) ) {
            $global_settings = get_option( 'team556_pay_global_settings' );
            $wallet_address = ! empty( $global_settings['wallet_address'] ) ? $global_settings['wallet_address'] : '';
        }
        return sanitize_text_field( $wallet_address );
    }

    /**
     * Fetch TEAM556 price from API.
     */
    private function fetch_team556_price() {
        $transient_key = 'team556_pay_price_data';
        $cached_data = get_transient( $transient_key );
        if ( false !== $cached_data ) {
            return $cached_data;
        }

        $response = wp_remote_get( self::TEAM556_PRICE_API_URL, array( 'timeout' => 10 ) );
        $data = array( 'price' => 0, 'error' => '' );

        if ( is_wp_error( $response ) ) {
            $data['error'] = __( 'API request failed: ', 'team556-pay' ) . $response->get_error_message();
        } else {
            $body = wp_remote_retrieve_body( $response );
            $decoded_body = json_decode( $body, true );
            if ( json_last_error() === JSON_ERROR_NONE && isset( $decoded_body['price'] ) ) {
                $data['price'] = floatval( $decoded_body['price'] );
            } else {
                $data['error'] = __( 'Invalid API response or price not found.', 'team556-pay' );
            }
        }
        set_transient( $transient_key, $data, MINUTE_IN_SECONDS * 5 ); // Cache for 5 minutes
        return $data;
    }

    /**
     * Build Solana Pay URL.
     */
    private function build_solana_pay_url( $recipient, $amount, $reference, $label = '', $memo = '' ) {
        if ( ! defined( 'TEAM556_PAY_TEAM556_TOKEN_MINT' ) ) {
            // Fallback or error if constant not defined, though it should be.
            return '#error-token-mint-not-defined';
        }

        $url_params = array(
            'recipient' => $recipient,
            'amount'    => number_format( $amount, self::TEAM556_DECIMALS, '.', '' ),
            'spl-token' => TEAM556_PAY_TEAM556_TOKEN_MINT,
            'reference' => $reference,
            'label'     => ! empty( $label ) ? $label : get_bloginfo( 'name' ),
            'message'   => ! empty( $memo ) ? $memo : sprintf( __( 'Payment of %s TEAM556 for %s', 'team556-pay' ), number_format( $amount, self::TEAM556_DECIMALS, '.', '' ), get_bloginfo( 'name' ) ),
        );
        
        // If a memo attribute was provided to the shortcode, use it instead of the default message.
        if (!empty($memo)) {
            $url_params['memo'] = $memo; // Solana Pay spec uses 'memo' for this field.
            unset($url_params['message']); // Avoid conflict if both are set, prioritize memo.
        }

        return 'solana:' . esc_url_raw( add_query_arg( $url_params, '' ) );
    }
}
