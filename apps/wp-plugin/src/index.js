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

// Expose QRCodeCanvas globally for use on the payment page
window.QRCodeCanvas = QRCodeCanvas;
// Also expose React and ReactDOM if not already available
if (typeof window.React === 'undefined') {
    window.React = require('react');
}
if (typeof window.ReactDOM === 'undefined') {
    window.ReactDOM = require('react-dom');
}

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
            action: 'team556_handle_get_block_payment_data_request',
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
                if (body.success && body.data) {
                    setPricingInfo({
                        tokenPrice: parseFloat(body.data.tokenPrice) || 0,
                        currency: body.data.currency || '',
                        cartTotalFiat: parseFloat(body.data.cartTotalFiat) || 0,
                        requiredTokenAmount: parseFloat(body.data.requiredTokenAmount) || 0,
                        loaded: true,
                        // Use errorMessage from AJAX if present, otherwise check if critical data is missing
                        error: body.data.errorMessage || 
                               (!body.data.requiredTokenAmount || parseFloat(body.data.requiredTokenAmount) <= 0 || !body.data.tokenPrice || parseFloat(body.data.tokenPrice) <= 0) 
                               ? __('Could not load token price or calculate amount. Please ensure cart is not empty.', 'team556-pay') 
                               : null
                    });
                } else {
                    const errorMessage = body.data && body.data.errorMessage ? body.data.errorMessage : __('Failed to load payment details. Please try again.', 'team556-pay');
                    console.error('Team556 Pay: Error fetching payment data:', body);
                    setPricingInfo({ tokenPrice: 0, currency: '', cartTotalFiat: 0, requiredTokenAmount: 0, loaded: true, error: errorMessage });
                }
            })
            .catch(error => {
                console.error('Team556 Pay: Network error fetching payment data:', error);
                setPricingInfo({ tokenPrice: 0, currency: '', cartTotalFiat: 0, requiredTokenAmount: 0, loaded: true, error: __('Network error. Please check your connection and try again.', 'team556-pay') });
            });
    }, []);

    const { description } = settings;

    if (!pricingInfo.loaded) {
        return <p>{__('Loading payment information...', 'team556-pay')}</p>;
    }

    return (
        <>
            {description && <p>{decodeEntities(description)}</p>}
            <div className="team556-pay-block-info" style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                {pricingInfo.error ? (
                    <p style={{ color: 'red' }}><strong>{__('Error:', 'team556-pay')}</strong> {pricingInfo.error}</p>
                ) : (
                    <>
                        {pricingInfo.tokenPrice > 0 && (
                            <p>
                                <strong>{__('Current Price:', 'team556-pay')}</strong> 1 TEAM556 = {pricingInfo.tokenPrice.toFixed(6)} {pricingInfo.currency}
                            </p>
                        )}
                        {pricingInfo.cartTotalFiat > 0 && (
                            <p>
                                <strong>{__('Order Total:', 'team556-pay')}</strong> {pricingInfo.cartTotalFiat.toFixed(2)} {pricingInfo.currency}
                            </p>
                        )}
                        {pricingInfo.requiredTokenAmount > 0 && (
                            <p>
                                <strong>{__('Amount Due:', 'team556-pay')}</strong> {pricingInfo.requiredTokenAmount.toFixed(9)} TEAM556
                            </p>
                        )}
                    </>
                )}
                
                <hr style={{ margin: '15px 0' }} />

                <p><strong>{__('Instructions:', 'team556-pay')}</strong></p>
                <ol style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: '15px' }}>
                    <li>{__('After clicking "Place Order", you will be taken to the payment page.', 'team556-pay')}</li>
                    <li>{__('On the payment page, you will see a QR code and a payment link.', 'team556-pay')}</li>
                    <li>{__('Open your Team556 Digital Armory and select the Pay Tab.', 'team556-pay')}</li>
                    <li>{__('Scan the QR code or paste the payment link to initiate the payment.', 'team556-pay')}</li>
                    <li>{__('Confirm the transaction in your wallet.', 'team556-pay')}</li>
                </ol>

                <p style={{ fontStyle: 'italic', fontSize: '0.9em' }}>
                    {__( 'Your order will be processed once the payment is confirmed on the network. The QR code and payment link will be shown on the next page after you place your order.', 'team556-pay' )}
                </p>
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
