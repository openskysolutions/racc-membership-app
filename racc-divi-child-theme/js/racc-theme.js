/**
 * RACC Theme JavaScript
 * Mobile menu functionality
 */

(function($) {
    'use strict';

    // Simple mobile menu functionality
    $(document).ready(function() {
        console.log('Mobile menu script loaded');

        // Mobile menu button click
        $('#mobile-menu-button').on('click', function(e) {
            e.preventDefault();
            console.log('Mobile menu button clicked');
            
            // Add open class to trigger CSS animations
            $('#mobile-menu-drawer').addClass('open');
            $('#mobile-menu-overlay').addClass('open');
            $('body').addClass('mobile-menu-open');
        });

        // Close button click
        $('#mobile-menu-close').on('click', function(e) {
            e.preventDefault();
            console.log('Mobile menu close clicked');
            
            // Remove open class
            $('#mobile-menu-drawer').removeClass('open');
            $('#mobile-menu-overlay').removeClass('open');
            $('body').removeClass('mobile-menu-open');
        });

        // Overlay click to close
        $('#mobile-menu-overlay').on('click', function(e) {
            if (e.target === this) {
                $('#mobile-menu-drawer').removeClass('open');
                $('#mobile-menu-overlay').removeClass('open');
                $('body').removeClass('mobile-menu-open');
            }
        });

        // Escape key to close
        $(document).on('keydown', function(e) {
            if (e.keyCode === 27) { // ESC key
                $('#mobile-menu-drawer').removeClass('open');
                $('#mobile-menu-overlay').removeClass('open');
                $('body').removeClass('mobile-menu-open');
            }
        });
    });

})(jQuery);