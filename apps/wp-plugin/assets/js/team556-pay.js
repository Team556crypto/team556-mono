/**
 * Team556 Solana Pay JavaScript
 * Handles Solana Pay payment functionality
 */
(function($) {
    'use strict';

    // Team556 Solana Pay object
    window.Team556SolanaPay = {
        /**
         * Initialize
         */
        init: function() {
            // Check if we are on the checkout page or if shortcode is present
            if ($('.team556-solana-pay-container').length > 0 || $('#team556-solana-pay-form').length > 0) {
                // Initialize payment functionality
                this.initPayment();

                // Handle payment button click
                $(document).on('click', '.team556-solana-pay-button', this.handlePaymentButtonClick);
            }
        },

        /**
         * Initialize payment functionality
         */
        initPayment: function() {
            // Initialize Solana connection based on selected network
            try {
                // Create connection to the Solana blockchain
                this.connection = new solanaWeb3.Connection(this.getNetworkRPC(), 'confirmed');
                console.log('Solana connection established');
            } catch (error) {
                console.error('Error initializing Solana connection:', error);
            }
        },

        /**
         * Get Solana network RPC URL
         */
        getNetworkRPC: function() {
            // Default to mainnet
            var network = 'mainnet-beta';
            
            // Get network from data attribute or localized variable
            if (typeof team556SolanaPay !== 'undefined' && team556SolanaPay.network) {
                network = team556SolanaPay.network;
            }
            
            switch (network) {
                case 'devnet':
                    return 'https://api.devnet.solana.com';
                case 'testnet':
                    return 'https://api.testnet.solana.com';
                default:
                    return 'https://api.mainnet-beta.solana.com';
            }
        },

        /**
         * Handle payment button click
         */
        handlePaymentButtonClick: function(e) {
            // Only intercept if this is Team556 Solana Pay
            if ($('.payment_method_team556_solana_pay').length > 0 && !$('.payment_method_team556_solana_pay').is(':checked')) {
                return true;
            }
            
            // If this is a shortcode, check if we should handle the click
            var $container = $(this).closest('.team556-solana-pay-container');
            if ($container.length === 0 && $('.team556-solana-pay-container').length > 0) {
                return true;
            }
            
            // Prevent default form submission
            e.preventDefault();
            
            // Show loading status
            Team556SolanaPay.updateStatus(team556SolanaPay.i18n.connecting, 'loading');
            
            // Initialize payment
            Team556SolanaPay.connectWallet()
                .then(function(wallet) {
                    // Connected to wallet
                    Team556SolanaPay.updateStatus(team556SolanaPay.i18n.connected, 'success');
                    
                    // Make the payment
                    return Team556SolanaPay.makePayment(wallet);
                })
                .then(function(signature) {
                    // Payment successful
                    Team556SolanaPay.updateStatus(team556SolanaPay.i18n.paymentSuccess, 'success');
                    
                    // Verify payment with server
                    return Team556SolanaPay.verifyPayment(signature);
                })
                .then(function(response) {
                    // Redirect to success page if available
                    if ($container.length > 0 && $container.data('success-url')) {
                        window.location.href = $container.data('success-url');
                    } else if (response && response.redirect) {
                        window.location.href = response.redirect;
                    }
                })
                .catch(function(error) {
                    console.error('Payment error:', error);
                    Team556SolanaPay.updateStatus(team556SolanaPay.i18n.paymentFailed + ' ' + error.message, 'error');
                    
                    // Redirect to cancel page if available
                    if ($container.length > 0 && $container.data('cancel-url')) {
                        setTimeout(function() {
                            window.location.href = $container.data('cancel-url');
                        }, 3000);
                    }
                });
                
            return false;
        },

        /**
         * Connect to wallet
         */
        connectWallet: async function() {
            try {
                // Check if Phantom or other Solana wallet is installed
                const isPhantomInstalled = window.phantom?.solana?.isPhantom || window.solana?.isPhantom;
                
                if (!isPhantomInstalled) {
                    throw new Error('Please install Phantom wallet extension or another Solana wallet');
                }
                
                // Connect to wallet (prefer Phantom but fall back to other wallet providers)
                const provider = window.phantom?.solana || window.solana;
                
                if (!provider) {
                    throw new Error('No Solana wallet provider found');
                }
                
                // Request connection
                await provider.connect();
                
                return provider;
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                throw error;
            }
        },

        /**
         * Make payment
         */
        makePayment: async function(provider) {
            try {
                // Get parameters
                var amount = this.getPaymentAmount();
                var recipientAddress = team556SolanaPay.merchantWallet;
                var tokenMintAddress = team556SolanaPay.tokenMint || 'H7MeLVHPZcmcMzKRYUdtTJ4Bh3FahpfcmNhduJ7KvERg'; // Fallback to Team556 token mint
                
                if (!recipientAddress) {
                    throw new Error('Merchant wallet address not configured');
                }
                
                // Convert addresses to PublicKey objects
                const recipientPublicKey = new solanaWeb3.PublicKey(recipientAddress);
                const tokenMintPublicKey = new solanaWeb3.PublicKey(tokenMintAddress);
                const senderPublicKey = provider.publicKey;
                
                if (!senderPublicKey) {
                    throw new Error('Could not get sender wallet public key');
                }
                
                // Find the associated token accounts for sender and recipient
                // We need to do this to send SPL tokens
                const senderTokenAccount = await this.findAssociatedTokenAddress(senderPublicKey, tokenMintPublicKey);
                const recipientTokenAccount = await this.findAssociatedTokenAddress(recipientPublicKey, tokenMintPublicKey);
                
                // Check if recipient token account exists, if not we need to create it
                const recipientAccountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
                
                // Build the transaction
                let transaction = new solanaWeb3.Transaction();
                
                // If recipient doesn't have a token account for Team556, create one
                if (!recipientAccountInfo) {
                    console.log('Recipient token account does not exist, creating...');
                    
                    // Add create associated token account instruction
                    transaction.add(
                        this.createAssociatedTokenAccountInstruction(
                            senderPublicKey, // payer
                            recipientTokenAccount, // associated token account
                            recipientPublicKey, // owner
                            tokenMintPublicKey // mint
                        )
                    );
                }
                
                // Amount is in native decimal units, convert to token units
                // Assuming Team556 tokens have 9 decimal places (standard for SPL tokens)
                const tokenDecimals = 9;
                const tokenAmount = Math.floor(amount * Math.pow(10, tokenDecimals));
                
                // Add token transfer instruction
                transaction.add(
                    this.createTransferInstruction(
                        senderTokenAccount, // source
                        recipientTokenAccount, // destination
                        senderPublicKey, // owner
                        tokenAmount // amount
                    )
                );
                
                // Get recent blockhash
                const { blockhash } = await this.connection.getRecentBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = senderPublicKey;
                
                // Sign and send transaction
                const signedTransaction = await provider.signTransaction(transaction);
                const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
                
                // Wait for confirmation
                const confirmation = await this.connection.confirmTransaction(signature);
                
                if (confirmation.err) {
                    throw new Error('Transaction failed to confirm: ' + JSON.stringify(confirmation.err));
                }
                
                return signature;
            } catch (error) {
                console.error('Error making payment:', error);
                throw error;
            }
        },

        /**
         * Find associated token address
         */
        findAssociatedTokenAddress: async function(walletAddress, tokenMintAddress) {
            // This is a helper function to find the associated token account address for a wallet
            // We're using a deterministic algorithm that matches what the chain uses
            const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            
            const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBytes(),
                    TOKEN_PROGRAM_ID.toBytes(),
                    tokenMintAddress.toBytes(),
                ],
                SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
            );
            
            return address;
        },
        
        /**
         * Create Associated Token Account instruction
         */
        createAssociatedTokenAccountInstruction: function(payer, associatedToken, owner, mint) {
            const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            const SYSVAR_RENT_PUBKEY = new solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111');
            const SYSTEM_PROGRAM_ID = new solanaWeb3.PublicKey('11111111111111111111111111111111');
            
            const keys = [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: associatedToken, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            ];
            
            return new solanaWeb3.TransactionInstruction({
                keys,
                programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
                data: new Uint8Array([]), 
            });
        },
        
        /**
         * Create Transfer instruction for SPL tokens
         */
        createTransferInstruction: function(source, destination, owner, amount) {
            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
            
            const keys = [
                { pubkey: source, isSigner: false, isWritable: true },
                { pubkey: destination, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false },
            ];
            
            // Token instruction: Transfer = 3
            const data = new Uint8Array([3, ...this.serializeUint64(amount)]); 
            
            return new solanaWeb3.TransactionInstruction({
                keys,
                programId: TOKEN_PROGRAM_ID,
                data,
            });
        },
        
        /**
         * Serialize uint64 for token instructions
         */
        serializeUint64: function(value) {
            // Use Uint8Array instead of Buffer for browser compatibility
            const buffer = new Uint8Array(8);
            const dataView = new DataView(buffer.buffer);
            
            // Write value as little-endian
            dataView.setBigUint64(0, BigInt(value), true); // true = little endian
            
            return [...buffer];
        },

        /**
         * Verify payment with server
         */
        verifyPayment: async function(signature) {
            try {
                // Get order ID if this is WooCommerce checkout
                var orderId = $('input[name="order_id"]').val();
                
                // Get amount
                var amount = this.getPaymentAmount();
                
                // Make API request to verify payment
                return $.ajax({
                    url: team556SolanaPay.restUrl + '/verify-payment',
                    method: 'POST',
                    data: {
                        signature: signature,
                        amount: amount,
                        order_id: orderId
                    },
                    headers: {
                        'X-WP-Nonce': team556SolanaPay.nonce
                    }
                });
            } catch (error) {
                console.error('Error verifying payment:', error);
                throw error;
            }
        },

        /**
         * Get payment amount
         */
        getPaymentAmount: function() {
            // Check if this is a shortcode payment
            var $container = $('.team556-solana-pay-container');
            if ($container.length > 0) {
                return parseFloat($container.data('amount')) || 0;
            }
            
            // Otherwise, get from WooCommerce checkout
            return parseFloat($('input[name="payment_method"]:checked').data('order_total')) || 0;
        },

        /**
         * Update payment status
         */
        updateStatus: function(message, status) {
            $('.team556-solana-pay-status').html(message).attr('data-status', status);
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        if (typeof solanaWeb3 !== 'undefined') {
            // Detect background color and set appropriate text color
            function setAdaptiveColors() {
                // Function to get background color of an element
                function getBackgroundColor(element) {
                    let bgColor = window.getComputedStyle(element).backgroundColor;
                    
                    // If the background is transparent or not set, check parent
                    if (bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)") {
                        if (element.parentElement) {
                            return getBackgroundColor(element.parentElement);
                        }
                        return "rgb(255, 255, 255)"; // Default to white if we can't determine
                    }
                    
                    return bgColor;
                }
                
                // Function to check if a color is dark or light
                function isColorDark(rgbColor) {
                    // Parse RGB values from format "rgb(r, g, b)" or "rgba(r, g, b, a)"
                    const rgbMatch = rgbColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
                    if (!rgbMatch) return false;
                    
                    const r = parseInt(rgbMatch[1], 10);
                    const g = parseInt(rgbMatch[2], 10);
                    const b = parseInt(rgbMatch[3], 10);
                    
                    // Calculate luminance (perceived brightness)
                    // Formula: (0.299*R + 0.587*G + 0.114*B)
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    
                    // Return true if the color is dark (luminance < 0.5)
                    return luminance < 0.5;
                }
                
                // Get the payment method element
                const paymentElement = document.querySelector('.payment_method_team556_solana_pay');
                if (!paymentElement) return;
                
                // Get background color
                const bgColor = getBackgroundColor(paymentElement);
                const isDark = isColorDark(bgColor);
                
                // Set CSS variables based on background color
                document.documentElement.style.setProperty(
                    '--team556-bg-color', 
                    isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                );
                
                document.documentElement.style.setProperty(
                    '--team556-text-color', 
                    isDark ? '#FFFFFF' : '#14151A'
                );
                
                document.documentElement.style.setProperty(
                    '--team556-border-color', 
                    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)'
                );
                
                // Apply additional styles for specific elements if needed
                if (isDark) {
                    // For dark backgrounds
                    $('.woocommerce-error').css('color', '#FF5C5C');
                } else {
                    // For light backgrounds
                    $('.woocommerce-error').css('color', '#b22222');
                }
            }
            
            // Run on page load
            setAdaptiveColors();
            
            // Run again after a short delay to ensure all elements are loaded
            setTimeout(setAdaptiveColors, 500);
            
            Team556SolanaPay.init();
        } else {
            console.error('Solana Web3 library not loaded');
            $('.team556-solana-pay-status').html('Solana Web3 library not loaded. Please try again later.').attr('data-status', 'error');
        }
    });

})(jQuery); 