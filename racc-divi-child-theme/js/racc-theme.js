/**
 * RACC Theme JavaScript
 * Exactly matching React app functionality for mobile menu and theme toggle
 */

(function($) {
    'use strict';

    // Theme management exactly matching React useTheme hook
    const ThemeManager = {
        init: function() {
            this.currentTheme = this.getTheme();
            this.applyTheme();
            this.updateThemeDisplay();
            this.bindEvents();
        },

        getTheme: function() {
            return localStorage.getItem('racc_theme') || 'light';
        },

        setTheme: function(theme) {
            localStorage.setItem('racc_theme', theme);
            this.currentTheme = theme;
            this.applyTheme();
            this.updateThemeDisplay();
        },

        applyTheme: function() {
            if (this.currentTheme === 'dark') {
                $('html').addClass('dark');
                $('body').addClass('dark');
            } else {
                $('html').removeClass('dark');
                $('body').removeClass('dark');
            }
        },

        updateThemeDisplay: function() {
            // Update theme toggle icons (matching React icons)
            const isDark = this.currentTheme === 'dark';
            $('.theme-icon').text(isDark ? '☀️' : '🌙');
        },

        toggle: function() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents: function() {
            const self = this;
            
            // Desktop and mobile theme toggle
            $(document).on('click', '#theme-toggle, #mobile-theme-toggle', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.toggle();
            });
        }
    };

    // Mobile Menu Manager exactly matching React Sheet component behavior
    const MobileMenuManager = {
        init: function() {
            this.isOpen = false;
            this.drawer = $('#mobile-menu-drawer');
            this.overlay = $('#mobile-menu-overlay');
            this.bindEvents();
        },

        open: function() {
            if (this.isOpen) return;
            
            this.isOpen = true;
            $('body').addClass('mobile-menu-open');
            
            // Show overlay
            this.overlay.removeClass('opacity-0 pointer-events-none').addClass('opacity-100 pointer-events-auto');
            
            // Show drawer with transform
            this.drawer.removeClass('-translate-x-full').addClass('translate-x-0');
            
            // Add open class for CSS transitions
            this.drawer.addClass('open');
            this.overlay.addClass('open');
        },

        close: function() {
            if (!this.isOpen) return;
            
            this.isOpen = false;
            $('body').removeClass('mobile-menu-open');
            
            // Hide overlay
            this.overlay.removeClass('opacity-100 pointer-events-auto').addClass('opacity-0 pointer-events-none');
            
            // Hide drawer
            this.drawer.removeClass('translate-x-0').addClass('-translate-x-full');
            
            // Remove open class
            this.drawer.removeClass('open');
            this.overlay.removeClass('open');
        },

        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        bindEvents: function() {
            const self = this;
            
            // Mobile menu button
            $(document).on('click', '#mobile-menu-button', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.open();
            });
            
            // Mobile menu close button
            $(document).on('click', '#mobile-menu-close', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.close();
            });
            
            // Close on overlay click
            $(document).on('click', '#mobile-menu-overlay', function(e) {
                if (e.target === this) {
                    self.close();
                }
            });
            
            // Close on navigation
            $(document).on('click', '#mobile-menu-drawer button[onclick]', function() {
                self.close();
            });
            
            // Handle theme toggle in mobile menu
            $(document).on('click', '#mobile-theme-toggle-container', function(e) {
                e.preventDefault();
                ThemeManager.toggle();
            });
            
            // Close menu on escape key
            $(document).on('keydown', function(e) {
                if (e.keyCode === 27 && self.isOpen) { // ESC key
                    self.close();
                }
            });
        }
    };

    // Initialize everything when DOM is ready
    $(document).ready(function() {
        ThemeManager.init();
        MobileMenuManager.init();
        
        console.log('RACC Theme initialized with mobile menu and theme management');
    });

})(jQuery);
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

            // Close on menu item click
            $(document).on('click', '#mobile-menu-drawer button', function(e) {
                // Only close if it's a navigation button, not action buttons
                if (!$(this).closest('.p-4.space-y-2').length) {
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

        open: function() {
            this.isOpen = true;
            this.drawer.addClass('open');
            this.overlay.addClass('open');
            $('body').addClass('mobile-menu-open');
        },

        close: function() {
            this.isOpen = false;
            this.drawer.removeClass('open');
            this.overlay.removeClass('open');
            $('body').removeClass('mobile-menu-open');
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