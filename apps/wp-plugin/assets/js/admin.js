/**
 * Team556 Solana Pay Admin JS
 */
(function($) {
    'use strict';

    // Initialize admin page functionality
    function initAdminPage() {
        // Tab navigation
        $('.team556-settings-tab').on('click', function(e) {
            e.preventDefault();
            
            // Get the tab ID
            var tabId = $(this).attr('data-tab');
            
            // Remove active class from all tabs
            $('.team556-settings-tab').removeClass('active');
            $('.team556-settings-content').removeClass('active');
            
            // Add active class to current tab
            $(this).addClass('active');
            $('#' + tabId).addClass('active');
            
            // Store the active tab in localStorage
            localStorage.setItem('team556_active_tab', tabId);
        });
        
        // Restore active tab from localStorage
        var activeTab = localStorage.getItem('team556_active_tab');
        if (activeTab) {
            $('.team556-settings-tab[data-tab="' + activeTab + '"]').trigger('click');
        } else {
            // Default to first tab
            $('.team556-settings-tab:first').trigger('click');
        }
        
        // Network switch toggle
        $('.team556-network-toggle').on('change', function() {
            if ($(this).is(':checked')) {
                $('.team556-network-label').text('Mainnet');
                $('#team556_network').val('mainnet');
            } else {
                $('.team556-network-label').text('Devnet');
                $('#team556_network').val('devnet');
            }
        });
        
        // Initialize network toggle based on saved value
        if ($('#team556_network').val() === 'mainnet') {
            $('.team556-network-toggle').prop('checked', true);
            $('.team556-network-label').text('Mainnet');
        } else {
            $('.team556-network-toggle').prop('checked', false);
            $('.team556-network-label').text('Devnet');
        }
        
        // Initialize color pickers
        if ($.fn.wpColorPicker) {
            $('.team556-color-picker').wpColorPicker({
                change: function(event, ui) {
                    // Update the color preview
                    $(this).closest('.team556-color-picker-wrapper')
                        .find('.team556-color-picker-preview')
                        .css('background-color', ui.color.toString());
                }
            });
        }
        
        // Simple color preview if color picker not available
        $('.team556-color-picker-wrapper').each(function() {
            var color = $(this).find('input').val();
            $(this).find('.team556-color-picker-preview').css('background-color', color);
        });
        
        // Copy to clipboard functionality
        $('.team556-copy-button').on('click', function(e) {
            e.preventDefault();
            
            var copyText = $(this).data('copy');
            var originalText = $(this).text();
            
            // Create temporary input
            var tempInput = $('<input>');
            $('body').append(tempInput);
            tempInput.val(copyText).select();
            document.execCommand('copy');
            tempInput.remove();
            
            // Update button text
            $(this).text('Copied!');
            
            // Reset button text after delay
            setTimeout(function() {
                $('.team556-copy-button').text(originalText);
            }, 2000);
        });
        
        // Confirmation dialog for reset button
        $('.team556-reset-button').on('click', function(e) {
            if (!confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
                e.preventDefault();
            }
        });
    }
    
    // Initialize on document ready
    $(document).ready(function() {
        initAdminPage();
    });
    
})(jQuery); 