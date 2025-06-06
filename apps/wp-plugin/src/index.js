// Resolve WooCommerce Blocks functions from global scope
// This is a workaround for potential mismatches in how @wordpress/scripts
// maps these externals versus how they are provided on the window object.
const wcGlobal = window.wc || {};

const blocksRegistry = wcGlobal.wcBlocksRegistry || {};
const registerPaymentMethod = blocksRegistry.registerPaymentMethod || ((paymentMethodInterface) => {
    console.error('Team556 Pay: registerPaymentMethod function not found on window.wc.wcBlocksRegistry. Payment method will not be registered.', paymentMethodInterface);
    return () => null; // Return a dummy unregister function or similar if needed
});

const wooSettings = wcGlobal.wcSettings || {};
const getSetting = wooSettings.getSetting || ((dataKey, defaultValue) => {
    console.error(`Team556 Pay: getSetting function not found on window.wc.wcSettings. Defaulting for key: ${dataKey}.`);
    return defaultValue;
});

import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useEffect } from '@wordpress/element';
import { QRCodeCanvas } from 'qrcode.react';
import { __ } from '@wordpress/i18n';
console.log('Team556 Pay: Block integration script loaded (src/index.js).');

// Get settings passed from PHP (via get_payment_method_data in the integration class)
// 'team556_pay_data' is derived from gateway ID 'team556_pay' + '_data' by WooCommerce Blocks
const settings = getSetting( 'team556_pay_data', {} );

const defaultTitle = __( 'Team556 Pay', 'team556-pay' ); // Fallback title
const title = decodeEntities( settings.title || defaultTitle );
const iconUrl = settings.icon || null; // Get the icon URL

/**
 * Content component - Renders the payment method's description and any fields.
 */
const Content = () => {
    const [qrValue, setQrValue] = useState('');
    const [pricingInfo, setPricingInfo] = useState({
        tokenPrice: 0,
        currency: '',
        cartTotalFiat: 0,
        requiredTokenAmount: 0,
        loaded: false,
        error: null
    });

    // Fetch payment data when the component mounts
    useEffect(() => {
        setQrValue(''); // Clear previous QR value
        setPricingInfo({ tokenPrice: 0, currency: '', cartTotalFiat: 0, requiredTokenAmount: 0, loaded: false, error: null }); // Clear previous pricing info
        const ajaxUrl = window.ajaxurl || '/wp-admin/admin-ajax.php'; // Fallback just in case
        const params = new URLSearchParams({
            action: 'team556_get_block_payment_data',
            // If you implement nonce later, add it here: 
            // security: settings.your_nonce_key_here 
        });

        fetch(`${ajaxUrl}?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(body => {
                // WooCommerce AJAX typically wraps success in { success: true, data: ... } 
                // or { success: false, data: ... } for errors handled by wp_send_json_error
                if (body.success && body.data && body.data.paymentUrl) {
                    setQrValue(body.data.paymentUrl);
                    setPricingInfo({
                        tokenPrice: parseFloat(body.data.tokenPrice) || 0,
                        currency: body.data.currency || '',
                        cartTotalFiat: parseFloat(body.data.cartTotalFiat) || 0,
                        requiredTokenAmount: parseFloat(body.data.requiredTokenAmount) || 0,
                        loaded: true,
                        error: (parseFloat(body.data.tokenPrice) || 0) <= 0 && !body.data.paymentUrl ? __('Could not load token price.', 'team556-pay') : null
                    });
                    // console.log('Team556 Pay: Payment URL received:', body.data.paymentUrl);
                    // console.log('Team556 Pay: Payment reference:', body.data.reference);
                    // console.log('Team556 Pay: Pricing info:', body.data);
                } else {
                    setPricingInfo({
                        tokenPrice: 0,
                        currency: '',
                        cartTotalFiat: 0,
                        requiredTokenAmount: 0,
                        loaded: true,
                        error: (body.data && body.data.message) || body.message || __('Error fetching payment details.', 'team556-pay')
                    });
                    console.error('Team556 Pay: Invalid or unsuccessful response from payment data endpoint.', body);
                    // TODO: Display a user-friendly error message in the UI
                }
            })
            .catch(error => {
                console.error('Team556 Pay: Error fetching payment data:', error);
                setPricingInfo({
                    tokenPrice: 0,
                    currency: '',
                    cartTotalFiat: 0,
                    requiredTokenAmount: 0,
                    loaded: true,
                    error: __('Network error or server unavailable while fetching payment details.', 'team556-pay')
                });
            });
        // You might also start polling for payment status here, using the reference from the response.
    }, []); // Empty dependency array means this runs once on mount. Consider re-fetching if cart changes.

    const description = decodeEntities( settings.description || '' );
    return (
        <>
            { description && <p>{ description }</p> }

            <div className="team556-pay-pricing-info" style={{ marginBottom: '20px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', background: '#f9f9f9' }}>
                { !pricingInfo.loaded && <p>{__('Loading payment details...', 'team556-pay')}</p> }
                { pricingInfo.loaded && pricingInfo.error && 
                    <p style={{ color: 'red' }}>
                        <strong>{__('Error:', 'team556-pay')}</strong> {pricingInfo.error}
                    </p> }
                { pricingInfo.loaded && !pricingInfo.error && pricingInfo.tokenPrice > 0 && (
                    <>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>{__('Order Total:', 'team556-pay')}</strong> {pricingInfo.cartTotalFiat.toFixed(2)} {pricingInfo.currency}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>{__('Current Price:', 'team556-pay')}</strong> 1 TEAM556 ≈ {pricingInfo.tokenPrice.toFixed(6)} {pricingInfo.currency}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '16px' }}>
                            <strong>{__('Amount Due:', 'team556-pay')}</strong> {pricingInfo.requiredTokenAmount.toFixed(6)} TEAM556
                        </p>
                    </>
                )}
                { pricingInfo.loaded && !pricingInfo.error && pricingInfo.tokenPrice <= 0 && qrValue && (
                     <p style={{ margin: '5px 0', fontSize: '14px' }}>{__('Could not retrieve current token price. Please refer to your wallet for the exact token amount based on the QR code.', 'team556-pay')}</p>
                )}
            </div>

            <div className="team556-pay-payment-instructions" style={{ marginTop: '15px' }}>
                <h4>Instructions:</h4>
                <ol>
                    <li>Open your Team556 Digital Armory and select the Pay Tab.</li>
                    <li>Scan the QR code below or paste the link in the Pay Tab to initiate the payment.</li>
                    <li>Confirm the transaction in your wallet.</li>
                </ol>
                <div className="team556-pay-qr-code-area" style={{ marginTop: '15px', marginBottom: '15px', textAlign: 'center' }}>
                    {qrValue ? (
                        <>
                            <QRCodeCanvas value={qrValue} size={200} bgColor="#ffffff" fgColor="#000000" level="L" />
                            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(qrValue).then(() => {
                                            alert(__('Payment link copied to clipboard!', 'team556-pay'));
                                        }).catch(() => {
                                            // Fallback for older browsers
                                            const textArea = document.createElement('textarea');
                                            textArea.value = qrValue;
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(textArea);
                                            alert(__('Payment link copied to clipboard!', 'team556-pay'));
                                        });
                                    }}
                                    style={{
                                        backgroundColor: '#0073aa',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px' // Removed marginRight
                                    }}
                                >
                                    {__('Copy Payment Link', 'team556-pay')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>{__('Generating QR Code...', 'team556-pay')}</p>
                    )}
                </div>
                <p style={{ fontStyle: 'italic', fontSize: '0.9em' }}>
                    {__( 'Your order will be processed once the payment is confirmed on the network.', 'team556-pay' )}
                </p>
                {/* Payment status updates could appear here */}
            </div>
        </>
    );
};

/**
 * Label component - Renders the payment method's title and icon.
 *
 * @param {*} props Props from payment API.
 */
const Label = ( props ) => {
    const { PaymentMethodLabel } = props.components;
    return (
        <PaymentMethodLabel 
            text={ title } 
            icon={ iconUrl ? <img src={ iconUrl } alt={ title } style={{ marginLeft: '8px', verticalAlign: 'middle', maxHeight: '24px' }} /> : null } 
        />
    );
};

// Payment method object to register with WooCommerce Blocks
const team556PayPaymentMethod = {
    name: "team556_pay", // This MUST match the 'name' property in your PHP integration class (Team556_Pay_Gateway_Blocks_Integration)
    label: <Label />,
    content: <Content />,
    edit: <Content />,
    canMakePayment: () => true,
    ariaLabel: title,
    supports: {
        features: settings.supports || [],
    },
};

// Register the payment method
console.log('Team556 Pay: About to register payment method in src/index.js with settings:', settings);
registerPaymentMethod( team556PayPaymentMethod );
console.log('Team556 Pay: registerPaymentMethod called in src/index.js with settings:', settings);
