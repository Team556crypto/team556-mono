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
        $.ajax({
            url: team556_solana_pay_params.ajax_url,
            type: 'POST',
            data: {
                action: 'team556_solana_pay_check_payment',
                reference: reference,
                nonce: team556_solana_pay_params.nonce
            },
            success: function(response) {
                if (response.success) {
                    if (response.data.status === 'completed') {
                        // Payment completed - update UI
                        clearInterval(paymentInterval);
                        statusContainer.html('Payment completed! Redirecting...').attr('data-status', 'success');
                        
                        // Store signature and submit
                        $('#team556_signature').val(response.data.signature);
                        
                        // Redirect to order received page or complete the order
                        setTimeout(function() {
                            $('form.checkout').submit();
                        }, 1500);
                    } else if (response.data.status === 'processing') {
                        statusContainer.html('Payment detected! Processing transaction...').attr('data-status', 'processing');
                    }
                } else {
                    console.log('Waiting for payment...');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error checking payment status:', error);
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