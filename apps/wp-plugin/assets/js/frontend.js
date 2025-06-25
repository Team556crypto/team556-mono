/**
 * Team556 Solana Pay Frontend JS
 */
(function($) {
    'use strict';

    // Only run on checkout page
    if (!$('#team556-solana-pay-form').length) {
        return;
    }

    // Initialize variables
    let paymentInterval;
    const statusContainer = $('.team556-solana-pay-status');
    const qrCodeContainer = $('#team556-solana-pay-qrcode');
    const spinner = $('.team556-qrcode-spinner');
    const reference = $('#team556_reference').val();
    const solanaPayUrl = $('#team556_solana_pay_url').val();
    const orderId = $('#team556_order_id').val() || '';

    // Initialize the QR code when the page loads
    function initQrCode() {
        // If QR library is loaded and URL exists
        if (typeof QRCode !== 'undefined' && solanaPayUrl) {
            try {
                // Clear any existing QR code
                qrCodeContainer.empty();
                
                // Show loading spinner
                spinner.show();
                
                // Generate QR code
                QRCode.toCanvas(document.getElementById('team556-solana-pay-qrcode'), solanaPayUrl, {
                    width: 240,
                    margin: 1,
                    color: {
                        dark: '#14151A', // Solana dark color
                        light: '#FFFFFF'
                    }
                }, function(error) {
                    if (error) {
                        console.error('Error generating QR code:', error);
                        statusContainer.html('Error generating QR code. Please try again.').attr('data-status', 'error');
                        spinner.hide();
                    } else {
                        // Hide spinner once QR code is generated
                        spinner.hide();
                        // Clear any previous error messages
                        statusContainer.html('').removeAttr('data-status');
                        
                        // Start polling for payment status
                        startPaymentCheck();
                    }
                });
            } catch (error) {
                console.error('Exception in QR code generation:', error);
                statusContainer.html('Error generating QR code. Please try again.').attr('data-status', 'error');
                spinner.hide();
            }
        } else {
            statusContainer.html('QR code library not loaded. Please refresh the page.').attr('data-status', 'error');
            spinner.hide();
        }
    }

    // Start polling for payment status
    function startPaymentCheck() {
        if (paymentInterval) {
            clearInterval(paymentInterval);
        }

        // Check payment status every 3 seconds
        paymentInterval = setInterval(checkPaymentStatus, 3000);
    }

    // Check payment status via AJAX
    function checkPaymentStatus() {
        console.log('Checking payment status for reference:', reference);
        
        $.ajax({
            url: team556_solana_pay_params.ajax_url,
            type: 'POST',
            data: {
                action: 'team556_solana_pay_check_payment',
                reference: reference,
                order_id: orderId || '',
                nonce: team556_solana_pay_params.nonce
            },
            success: function(response) {
                console.log('Payment status response:', response);
                
                if (response.success) {
                    // Handle different payment statuses
                    if (response.data.status === 'paid' || response.data.status === 'completed') {
                        // Payment completed - update UI and stop polling
                        clearInterval(paymentInterval);
                        statusContainer.html('Payment confirmed! Redirecting...').attr('data-status', 'success');
                        
                        // Store signature if available
                        if (response.data.signature) {
                            $('#team556_signature').val(response.data.signature);
                        }
                        
                        // Handle redirect based on response or form submission
                        setTimeout(function() {
                            if (response.data.redirect_url) {
                                // Use the redirect URL provided by the server
                                window.location.href = response.data.redirect_url;
                            } else if ($('form.checkout').length) {
                                // Submit the checkout form if it exists
                                $('form.checkout').submit();
                            } else {
                                // Fallback to refreshing the current page
                                window.location.reload();
                            }
                        }, 1500);
                    } 
                    // Handle processing status
                    else if (response.data.status === 'processing') {
                        statusContainer.html('Payment detected! Processing transaction...').attr('data-status', 'processing');
                    }
                    // Handle pending status
                    else if (response.data.status === 'pending') {
                        statusContainer.html('Waiting for payment confirmation...').attr('data-status', 'pending');
                    }
                    // Handle any message from the server
                    if (response.data.message) {
                        console.log('Server message:', response.data.message);
                    }
                } else {
                    // Handle error responses
                    if (response.data && response.data.message) {
                        console.warn('Payment status check error:', response.data.message);
                    } else {
                        console.log('Waiting for payment...');
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error checking payment status:', error);
                // Continue polling despite errors
            }
        });
    }

    // Handle refresh rate button click
    $('#team556-refresh-rate').on('click', function(e) {
        e.preventDefault();
        
        // Add spin animation to the refresh icon
        $(this).find('.dashicons').addClass('team556-refresh-spin');
        
        // Simulate refreshing the rate (in a real implementation, you would fetch the current rate)
        setTimeout(function() {
            // Get order total
            var orderTotal = parseFloat($('#team556_order_total').val());
            
            // Use fixed conversion rate for now (3.5 TEAM556 per $1)
            var conversionRate = 3.5;
            
            // Calculate new token amount
            var tokenAmount = orderTotal * conversionRate;
            var tokenAmountFormatted = tokenAmount.toFixed(2);
            
            // Update the displayed token amount
            $('#team556-token-amount').text(tokenAmountFormatted);
            $('#team556-token-amount-instructions').text(tokenAmountFormatted);
            
            // Regenerate QR code with updated amount
            regenerateQrCode(orderTotal, tokenAmount);
            
            // Remove spin animation
            $('#team556-refresh-rate').find('.dashicons').removeClass('team556-refresh-spin');
        }, 1000); // Simulate a 1-second delay
    });

    // Function to regenerate QR code with new amount
    function regenerateQrCode(usdAmount, tokenAmount) {
        // Show spinner
        spinner.show();
        
        // Clear existing QR code
        qrCodeContainer.empty();
        
        // Get reference
        var reference = $('#team556_reference').val();
        
        // Get recipient from hidden field or use default
        var solanaPayUrlParts = $('#team556_solana_pay_url').val().split('?');
        var recipient = solanaPayUrlParts[0].replace('solana:', '');
        
        // Token mint is hardcoded for security
        var tokenMint = 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg';
        var shopName = document.title.split('-')[0].trim();
        
        // Format amounts for the token amount
        var tokenAmountStr = tokenAmount.toFixed(2);
        
        // Create Solana Pay URL
        var solanaPayUrl = 'solana:' + recipient + 
                           '?spl-token=' + tokenMint + 
                           '&amount=' + tokenAmountStr +
                           '&reference=' + reference +
                           '&label=' + encodeURIComponent(shopName) +
                           '&message=' + encodeURIComponent('Payment for order at ' + shopName);
        
        // Update hidden field
        $('#team556_solana_pay_url').val(solanaPayUrl);
        
        // Generate new QR code
        if (typeof QRCode !== 'undefined') {
            try {
                QRCode.toCanvas(document.getElementById('team556-solana-pay-qrcode'), solanaPayUrl, {
                    width: 240,
                    margin: 1,
                    color: {
                        dark: '#14151A',
                        light: '#FFFFFF'
                    }
                }, function(error) {
                    if (error) {
                        console.error('Error generating QR code:', error);
                        statusContainer.html('Error generating QR code. Please try again.').attr('data-status', 'error');
                        spinner.hide();
                    } else {
                        // Hide spinner once QR code is generated
                        spinner.hide();
                        // Clear any previous error messages
                        statusContainer.html('').removeAttr('data-status');
                    }
                });
            } catch (error) {
                console.error('Exception in QR code generation:', error);
                statusContainer.html('Error generating QR code. Please try again.').attr('data-status', 'error');
                spinner.hide();
            }
        } else {
            statusContainer.html('QR code library not loaded. Please refresh the page.').attr('data-status', 'error');
            spinner.hide();
        }
    }

    // Initialize on page load
    $(document).ready(function() {
        initQrCode();
    });

})(jQuery); 