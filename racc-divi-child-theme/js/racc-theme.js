/**
 * RACC Theme JavaScript
 * Exactly matching React app functionality for mobile menu and theme toggle
 */

(function($) {
    'use strict';

    // Theme management
    const ThemeManager = {
        init: function() {
            this.currentTheme = this.getTheme();
            this.updateThemeDisplay();
            this.bindEvents();
        },

        getTheme: function() {
            return localStorage.getItem('racc_theme') || 'light';
        },

        setTheme: function(theme) {
            localStorage.setItem('racc_theme', theme);
            this.currentTheme = theme;
            this.updateThemeDisplay();
            this.applyTheme();
        },

        updateThemeDisplay: function() {
            const isDark = this.currentTheme === 'dark';
            $('.theme-icon').text(isDark ? '☀️' : '🌙');
        },

        applyTheme: function() {
            if (this.currentTheme === 'dark') {
                $('body').addClass('dark');
            } else {
                $('body').removeClass('dark');
            }
        },

        toggle: function() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents: function() {
            const self = this;
            
            // Desktop theme toggle
            $(document).on('click', '#theme-toggle', function(e) {
                e.preventDefault();
                self.toggle();
            });

            // Mobile theme toggle
            $(document).on('click', '#mobile-theme-toggle', function(e) {
                e.preventDefault();
                self.toggle();
            });
        }
    };

    // Mobile Menu Manager
    const MobileMenu = {
        init: function() {
            this.drawer = $('#mobile-menu-drawer');
            this.overlay = $('#mobile-menu-overlay');
            this.isOpen = false;
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;

            // Open mobile menu
            $(document).on('click', '#mobile-menu-button', function(e) {
                e.preventDefault();
                self.open();
            });

            // Close mobile menu
            $(document).on('click', '#mobile-menu-close', function(e) {
                e.preventDefault();
                self.close();
            });

            // Close on overlay click
            $(document).on('click', '#mobile-menu-overlay', function(e) {
                e.preventDefault();
                self.close();
            });

            // Close on link click
            $(document).on('click', '.racc-mobile-menu-drawer a', function(e) {
                self.close();
            });

            // Close on escape key
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                }
            });
        },

        open: function() {
            this.isOpen = true;
            this.drawer.addClass('open');
            this.overlay.addClass('open');
            $('body').addClass('mobile-menu-open');
            
            // Add hamburger animation if present
            $('#mobile-menu-button .hamburger-icon').addClass('open');
        },

        close: function() {
            this.isOpen = false;
            this.drawer.removeClass('open');
            this.overlay.removeClass('open');
            $('body').removeClass('mobile-menu-open');
            
            // Remove hamburger animation if present
            $('#mobile-menu-button .hamburger-icon').removeClass('open');
        }
    };

    // User Menu Dropdown Manager (for desktop)
    const UserMenu = {
        init: function() {
            this.button = $('#user-menu-button');
            this.menu = $('#user-menu');
            this.isOpen = false;
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;

            // Toggle user menu
            $(document).on('click', '#user-menu-button', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.toggle();
            });

            // Close on outside click
            $(document).on('click', function(e) {
                if (!self.button.is(e.target) && !self.menu.is(e.target) && self.menu.has(e.target).length === 0) {
                    self.close();
                }
            });

            // Close on escape key
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                }
            });
        },

        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function() {
            this.isOpen = true;
            this.menu.removeClass('hidden').fadeIn(200);
            this.button.attr('aria-expanded', 'true');
        },

        close: function() {
            this.isOpen = false;
            this.menu.fadeOut(200, function() {
                $(this).addClass('hidden');
            });
            this.button.attr('aria-expanded', 'false');
        }
    };

    // Smooth scroll for anchor links
    const SmoothScroll = {
        init: function() {
            $(document).on('click', 'a[href^="#"]', function(e) {
                const target = $(this.getAttribute('href'));
                if (target.length) {
                    e.preventDefault();
                    $('html, body').animate({
                        scrollTop: target.offset().top - 80 // Account for sticky header
                    }, 600);
                }
            });
        }
    };

    // Header scroll effect
    const HeaderScroll = {
        init: function() {
            this.header = $('header');
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;
            $(window).on('scroll', function() {
                self.updateHeader();
            });
        },

        updateHeader: function() {
            const scrollTop = $(window).scrollTop();
            if (scrollTop > 10) {
                this.header.addClass('scrolled');
            } else {
                this.header.removeClass('scrolled');
            }
        }
    };

    // Authentication simulation (you can replace this with real auth logic)
    const AuthManager = {
        init: function() {
            this.isAuthenticated = false; // Replace with real auth check
            this.updateUI();
        },

        updateUI: function() {
            if (this.isAuthenticated) {
                // Show authenticated state
                $('.auth-only').show();
                $('.guest-only').hide();
                $('#mobile-user-profile').removeClass('hidden');
            } else {
                // Show guest state
                $('.auth-only').hide();
                $('.guest-only').show();
                $('#mobile-user-profile').addClass('hidden');
            }
        }
    };

    // Initialize everything when document is ready
    $(document).ready(function() {
        ThemeManager.init();
        MobileMenu.init();
        UserMenu.init();
        SmoothScroll.init();
        HeaderScroll.init();
        AuthManager.init();

        // Apply saved theme on page load
        ThemeManager.applyTheme();

        // Add any additional animations or effects
        $('.racc-btn').on('mouseenter', function() {
            $(this).addClass('hover-effect');
        }).on('mouseleave', function() {
            $(this).removeClass('hover-effect');
        });
    });

    // Expose managers globally for debugging
    window.RACC = {
        ThemeManager: ThemeManager,
        MobileMenu: MobileMenu,
        UserMenu: UserMenu,
        AuthManager: AuthManager
    };

})(jQuery);