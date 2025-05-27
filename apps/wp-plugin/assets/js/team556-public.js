/**
 * Team556 Solana Pay Public JavaScript
 *
 * Handles payment button clicks and AJAX communication with the WP backend.
 */
(function($) {
    'use strict';

    $(function() {

        // --- Configuration --- 
        const paymentButtonSelector = '.team556-solana-pay-button'; // Class for the payment button
        const qrCodeContainerSelector = '.team556-solana-pay-qr-container'; // Container to display QR code
        const messageContainerSelector = '.team556-solana-pay-message'; // Container for status messages
        const loadingClass = 'team556-loading'; // Class to add during AJAX request

        // --- Event Listener --- 
        $(document).on('click', paymentButtonSelector, function(e) {
            e.preventDefault();

            const $button = $(this);
            const $form = $button.closest('form'); // Assuming button is inside a form or related container
            const $qrContainer = $form.find(qrCodeContainerSelector);
            const $messageContainer = $form.find(messageContainerSelector);

            // Prevent multiple clicks while processing
            if ($button.hasClass(loadingClass) || $button.prop('disabled')) {
                return;
            }

            // Clear previous messages/QR codes
            $qrContainer.empty().hide();
            $messageContainer.empty().hide();

            // Get data from button attributes
            const amount = $button.data('amount');
            const description = $button.data('description') || ''; // Optional description
            const orderId = $button.data('order-id'); // Optional order ID
            // Add any other necessary data attributes here

            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                displayMessage('Error: Invalid payment amount specified.', true, $messageContainer);
                return;
            }

            // Add loading state
            $button.addClass(loadingClass).prop('disabled', true);
            displayMessage('Generating payment request...', false, $messageContainer);

            // --- AJAX Request --- 
            $.post(team556_ajax_obj.ajax_url, {
                action: 'team556_create_payment', // Matches PHP hook: wp_ajax_team556_create_payment
                // nonce: team556_ajax_obj.nonce, // Uncomment if using nonce verification
                amount: amount,
                description: description,
                order_id: orderId
                // Add other data fields if needed
            })
            .done(function(response) {
                if (response.success && response.data && response.data.solana_pay_url) {
                    displayMessage('Scan the QR code with a compatible wallet.', false, $messageContainer);
                    generateQrCode(response.data.solana_pay_url, $qrContainer);
                    // Optional: Start polling for payment confirmation here if needed
                } else {
                    const errorMessage = response.data && response.data.message ? response.data.message : 'An unknown error occurred.';
                    displayMessage('Error: ' + errorMessage, true, $messageContainer);
                    if (response.data && response.data.details) {
                        console.error('Payment creation error details:', response.data.details);
                    }
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown, jqXHR.responseText);
                let errorMsg = 'An error occurred while communicating with the server. Please try again.';
                if (jqXHR.responseJSON && jqXHR.responseJSON.data && jqXHR.responseJSON.data.message) {
                    errorMsg = jqXHR.responseJSON.data.message;
                }
                displayMessage('Error: ' + errorMsg, true, $messageContainer);
            })
            .always(function() {
                // Remove loading state
                $button.removeClass(loadingClass).prop('disabled', false);
            });
        });

        // --- Helper Functions --- 

        /**
         * Displays a message to the user.
         * @param {string} message - The message text.
         * @param {boolean} isError - True if the message is an error.
         * @param {jQuery} $container - The jQuery object of the message container.
         */
        function displayMessage(message, isError, $container) {
            if (!$container || $container.length === 0) {
                console.warn('Message container not found.');
                return; 
            }
            $container.text(message).toggleClass('error', isError).fadeIn();
        }

        /**
         * Generates and displays a QR code.
         * Requires a QR code generation library (like qrcode.js or kjua).
         * This example uses kjua, assuming it's loaded.
         * @param {string} text - The text to encode (Solana Pay URL).
         * @param {jQuery} $container - The jQuery object of the QR code container.
         */
        function generateQrCode(text, $container) {
            if (!$container || $container.length === 0) {
                console.error('QR code container not found.');
                return;
            }
            
            // Check if QR code library is available (example using kjua)
            if (typeof kjua === 'undefined') {
                 console.error('QR code library (kjua) not loaded.');
                 $container.text('Error: QR code library not loaded. Please install/enqueue it. URL: ' + text).addClass('error').show();
                 // Provide the raw link as a fallback
                 let fallbackLink = $('<a>').attr('href', text).text('Click here to pay');
                 $container.append('<br>').append(fallbackLink);
                 return;
             }

            try {
                const qrElement = kjua({
                    render: 'canvas', // or 'svg'
                    crisp: true,
                    minVersion: 1,
                    ecLevel: 'L', // Error correction level (L, M, Q, H)
                    size: 256, // Size in pixels
                    ratio: null,
                    fill: '#333', // QR code color
                    back: '#fff', // Background color
                    text: text,
                    rounded: 0, // Rounding factor (0-100)
                    quiet: 1, // Quiet zone (modules)
                    mode: 'plain' // 'plain', 'label', 'image'
                });
                $container.empty().append(qrElement).fadeIn();
            } catch (error) {
                console.error('Error generating QR code:', error);
                displayMessage('Error generating QR code.', true, $container);
                 // Provide the raw link as a fallback
                 let fallbackLink = $('<a>').attr('href', text).text('Click here to pay');
                 $container.append('<br>').append(fallbackLink);
            }
        }

        // --- Initialization --- 
        // Could add checks here if needed
        console.log('Team556 Solana Pay Public JS Initialized.');

    });

})(jQuery);
