/**
 * Team556 Solana Pay Admin JavaScript
 * Handles admin UI interactions
 */
(function($) {
    'use strict';

    // Team556 Solana Pay Admin object
    var Team556SolanaPayAdmin = {
        /**
         * Initialize
         */
        init: function() {
            this.initClipboard();
            this.initFilters();
            this.initColorPicker();
            this.initTabs();
            this.applyDarkThemeToWPElements();
        },

        /**
         * Initialize clipboard functionality
         */
        initClipboard: function() {
            $(document).on('click', '.team556-clipboard-copy', function() {
                var textToCopy = $(this).data('clipboard');
                
                // Create temporary textarea
                var $temp = $('<textarea>');
                $('body').append($temp);
                $temp.val(textToCopy).select();
                
                // Copy and remove temporary element
                document.execCommand('copy');
                $temp.remove();
                
                // Show success indicator
                var $icon = $(this).find('.dashicons');
                $icon.removeClass('dashicons-clipboard').addClass('dashicons-yes');
                
                // Reset after delay
                setTimeout(function() {
                    $icon.removeClass('dashicons-yes').addClass('dashicons-clipboard');
                }, 1500);
            });
        },

        /**
         * Initialize transaction filters
         */
        initFilters: function() {
            // Auto-submit on status change
            $('.team556-transactions-filters select[name="status"]').on('change', function() {
                $(this).closest('form').submit();
            });
        },

        /**
         * Initialize color picker
         */
        initColorPicker: function() {
            if ($.fn.wpColorPicker) {
                $('input[name="team556_solana_pay_button_color"]').wpColorPicker();
            }
        },

        /**
         * Initialize settings tabs
         */
        initTabs: function() {
            // Tab functionality
            $('.team556-settings-tab').on('click', function(e) {
                e.preventDefault();
                
                var target = $(this).data('tab');
                
                // Update active tab
                $('.team556-settings-tab').removeClass('nav-tab-active');
                $(this).addClass('nav-tab-active');
                
                // Show target section, hide others
                $('.team556-settings-section').hide();
                $('#' + target).show();
                
                // Update active tab in URL
                if (history.pushState) {
                    var url = new URL(window.location);
                    url.searchParams.set('tab', target);
                    window.history.pushState({}, '', url);
                }
            });
            
            // Check for tab in URL
            var urlParams = new URLSearchParams(window.location.search);
            var activeTab = urlParams.get('tab');
            
            if (activeTab) {
                $('.team556-settings-tab[data-tab="' + activeTab + '"]').trigger('click');
            } else {
                // Default to first tab
                $('.team556-settings-tab:first').trigger('click');
            }
        },

        /**
         * Apply dark theme styling to WordPress UI elements
         */
        applyDarkThemeToWPElements: function() {
            if ($('.team556-dark-theme').length || $('.team556-dark-theme-wrapper').length) {
                // Style WP UI elements to match dark theme
                $('.wrap h1, .wrap h2').css('color', '#FFFFFF');
                
                // Style notice boxes
                $('.notice').each(function() {
                    $(this).css({
                        'background-color': '#1C1D24',
                        'border-color': 'rgba(255, 255, 255, 0.08)',
                        'color': '#FFFFFF'
                    });
                });
                
                // Style form buttons
                $('.wrap .button').not('.wp-color-result').each(function() {
                    $(this).addClass('team556-button').removeClass('button button-primary button-secondary');
                });
                
                // Style pagination
                $('.tablenav-pages a, .tablenav-pages span').css({
                    'background-color': '#14151A',
                    'border-color': 'rgba(255, 255, 255, 0.08)',
                    'color': '#FFFFFF'
                });
                
                // Style WP List Table
                $('.wp-list-table').each(function() {
                    $(this).addClass('team556-styled-table');
                });
            }
        },

        /**
         * Delete transaction
         */
        deleteTransaction: function(id, nonce) {
            if (!confirm(team556SolanaPayAdmin.i18n.confirmDelete)) {
                return;
            }
            
            $.ajax({
                url: team556SolanaPayAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'team556_solana_pay_delete_transaction',
                    id: id,
                    nonce: nonce
                },
                beforeSend: function() {
                    alert(team556SolanaPayAdmin.i18n.deletingTransaction);
                },
                success: function(response) {
                    if (response.success) {
                        alert(team556SolanaPayAdmin.i18n.transactionDeleted);
                        window.location.reload();
                    } else {
                        alert(response.data.message || team556SolanaPayAdmin.i18n.error);
                    }
                },
                error: function() {
                    alert(team556SolanaPayAdmin.i18n.error);
                }
            });
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        Team556SolanaPayAdmin.init();
    });

})(jQuery); 