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
                nonce: team556_ajax_obj.nonce,
                amount: amount,
                description: description,
                order_id: orderId
                // Add other data fields if needed
            })
            .done(function(response) {
                if (response.success && response.data && response.data.solana_pay_url) {
                    displayMessage('Scan the QR code with a compatible wallet.', false, $messageContainer);
                    generateQrCode(response.data.solana_pay_url, $qrContainer);
                    
                    // Start polling for payment confirmation
                    if (response.data.reference || response.data.order_id) {
                        // First show a status message
                        displayMessage('QR code generated. Waiting for payment confirmation...', false, $messageContainer);
                        console.log('Starting payment polling for order:', response.data.order_id, 'reference:', response.data.reference);
                        
                        // Then start polling
                        startPaymentStatusPolling(
                            response.data.reference || '',
                            response.data.order_id || '',
                            response.data.success_url || '',
                            $messageContainer,
                            $button
                        );
                    }
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
         * Starts polling for payment status updates
         * @param {string} reference - The payment reference ID
         * @param {string} orderId - The WooCommerce order ID
         * @param {string} successUrl - The URL to redirect to after successful payment
         * @param {jQuery} $messageContainer - The jQuery object of the message container
         * @param {jQuery} $button - The payment button object
         */
        function startPaymentStatusPolling(reference, orderId, successUrl, $messageContainer, $button) {
            console.log('Starting payment polling with params:', { reference, orderId, successUrl });
            
            // Initialize variables
            const pollingInterval = 3000; // 3 seconds
            const maxAttempts = 60; // 60 attempts = 3 minutes total polling time
            let attempts = 0;
            let pollTimer = null;
            
            // Display initial message
            displayMessage('Waiting for payment confirmation...', false, $messageContainer);
            
            // Create a status indicator element
            const $statusIndicator = $('<div class="team556-payment-status">Status: <span class="status-text">Checking payment...</span></div>');
            $messageContainer.after($statusIndicator);
            
            // Start polling
            pollTimer = setInterval(function() {
                attempts++;
                $statusIndicator.find('.status-text').text('Checking payment... Attempt ' + attempts);
                
                // Update message every 5 attempts (15 seconds)
                if (attempts % 5 === 0) {
                    console.log('Team556 Pay: Still polling after ' + attempts + ' attempts');
                    displayMessage(`Still waiting for payment confirmation... (${Math.floor(attempts/20)} minute${attempts >= 20 ? 's' : ''})`, false, $messageContainer);
                }
                
                // Check if max attempts reached
                if (attempts >= maxAttempts) {
                    clearInterval(pollTimer);
                    $statusIndicator.remove();
                    displayMessage('Payment confirmation timed out. If you completed the payment, please contact customer support.', true, $messageContainer);
                    $button.removeClass('team556-loading').prop('disabled', false);
                    return;
                }
                
                // Make the AJAX call to check payment status
                $.ajax({
                    url: team556_ajax_obj.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'team556_pay_check_order_status',
                        nonce: team556_ajax_obj.nonce,
                        reference: reference,
                        order_id: orderId
                    },
                    success: function(response) {
                        console.log('Team556 Pay: Status check response:', response);
                        if (response && response.success) {
                            if (response.data && response.data.status === 'paid') {
                                // Payment confirmed!
                                clearInterval(pollTimer);
                                $statusIndicator.find('.status-text').text('Payment confirmed!');
                                $statusIndicator.addClass('success');
                                displayMessage('Payment confirmed! Redirecting to confirmation page...', false, $messageContainer);
                                console.log('Team556 Pay: Payment confirmed. Signature:', response.data.signature);
                                
                                // Show success message and redirect
                                $messageContainer.append('<div class="team556-success-message" style="color: green; font-weight: bold; margin-top: 10px;">✓ Payment successfully processed!</div>');
                                
                                // Redirect to success page after a short delay
                                setTimeout(function() {
                                    // If we have a redirect URL in the response, use it first
                                    if (response.data && response.data.redirect_url) {
                                        console.log('Team556 Pay: Redirecting to:', response.data.redirect_url);
                                        window.location.href = response.data.redirect_url;
                                    }
                                    // Otherwise, if we have a success URL from the initial request
                                    else if (successUrl) {
                                        console.log('Team556 Pay: Redirecting to success URL:', successUrl);
                                        window.location.href = successUrl;
                                    }
                                    // Last resort - if we have an order ID, construct a standard WooCommerce URL
                                    else if (orderId) {
                                        console.log('Team556 Pay: Redirecting to order received page');
                                        window.location.href = '/checkout/order-received/' + orderId;
                                    } 
                                    // Very last resort - just reload the page
                                    else {
                                        console.log('Team556 Pay: No redirect URL available, reloading page');
                                        window.location.reload();
                                    }
                                }, 2000);
                            } else {
                                // Still waiting...
                                console.log('Team556 Pay: Payment status check - still pending');
                            }
                        } else {
                            console.error('Team556 Pay: Error checking payment status:', response);
                            // Don't stop polling on error, just log it
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error('Team556 Pay: AJAX error checking payment status:', textStatus, errorThrown, jqXHR.responseText);
                        // Don't stop polling on error, just log it
                    }
                });
            }, pollingInterval);
            
            // Return the timer ID in case we need to cancel it externally
            return pollTimer;
        }
        
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

            // Check if QRCode library is available (from qrcode.min.js)
            if (typeof QRCode === 'undefined') {
                console.error('QR code library (QRCode.js) not loaded.');
                $container.text('Error: QR code library not loaded. URL: ' + text).addClass('error').show();
                // Provide the raw link as a fallback
                let fallbackLink = $('<a>').attr('href', text).text('Click here to pay');
                $container.append('<br>').append(fallbackLink);
                return;
            }

            try {
                $container.empty(); // Clear previous QR code
                new QRCode($container[0], {
                    text: text,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H // High error correction
                });
                $container.fadeIn();
                console.log('Team556 Pay: QR Code generated for:', text);
            } catch (error) {
                console.error('Error generating QR code with QRCode.js:', error);
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
