/**
 * RACC Page Template JavaScript
 * All functionality needed for the RACC DIVI template including:
 * - Mobile menu management
 * - Theme toggle functionality  
 * - User menu dropdowns
 * - Smooth scrolling
 * - Header scroll effects
 * - Button animations
 */

(function() {
    'use strict';

    // Utility functions
    const Utils = {
        ready: function(fn) {
            if (document.readyState !== 'loading') {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        },

        hasClass: function(element, className) {
            return element.classList.contains(className);
        },

        addClass: function(element, className) {
            element.classList.add(className);
        },

        removeClass: function(element, className) {
            element.classList.remove(className);
        },

        toggleClass: function(element, className) {
            element.classList.toggle(className);
        }
    };

    // Theme Management
    const ThemeManager = {
        init: function() {
            this.currentTheme = this.getTheme();
            this.updateThemeDisplay();
            this.bindEvents();
            this.applyTheme();
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
            const themeIcons = document.querySelectorAll('.theme-icon');
            themeIcons.forEach(icon => {
                icon.textContent = isDark ? '☀️' : '🌙';
            });
        },

        applyTheme: function() {
            if (this.currentTheme === 'dark') {
                Utils.addClass(document.body, 'dark');
            } else {
                Utils.removeClass(document.body, 'dark');
            }
        },

        toggle: function() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents: function() {
            const self = this;
            
            // Desktop theme toggle
            document.addEventListener('click', function(e) {
                if (e.target.id === 'theme-toggle' || e.target.closest('#theme-toggle')) {
                    e.preventDefault();
                    self.toggle();
                }
                // Mobile theme toggle
                if (e.target.id === 'mobile-theme-toggle' || e.target.closest('#mobile-theme-toggle')) {
                    e.preventDefault();
                    self.toggle();
                }
            });
        }
    };

    // Mobile Menu Manager
    const MobileMenu = {
        init: function() {
            this.menuButton = document.getElementById('racc-mobile-menu-btn');
            this.closeButton = document.getElementById('racc-mobile-menu-close');
            this.menuOverlay = null;
            this.backdrop = null;
            this.isOpen = false;
            
            this.createElements();
            this.bindEvents();
        },

        createElements: function() {
            // Find the mobile menu section and add the correct class
            const menuSections = document.querySelectorAll('.et_pb_section');
            for (let section of menuSections) {
                if (section.innerHTML.includes('racc-mobile-header')) {
                    this.menuOverlay = section;
                    Utils.addClass(section, 'racc-mobile-menu-overlay');
                    break;
                }
            }

            // Create backdrop element
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'racc-mobile-menu-backdrop';
            document.body.appendChild(this.backdrop);
        },

        bindEvents: function() {
            const self = this;

            // Open mobile menu
            if (this.menuButton) {
                this.menuButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.open();
                });
            }

            // Close mobile menu
            if (this.closeButton) {
                this.closeButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.close();
                });
            }

            // Close on backdrop click
            if (this.backdrop) {
                this.backdrop.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.close();
                });
            }

            // Close on navigation link click
            document.addEventListener('click', function(e) {
                if (e.target.closest('#racc-mobile-nav-placeholder a')) {
                    self.close();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                }
            });
        },

        open: function() {
            this.isOpen = true;
            if (this.menuOverlay) {
                Utils.addClass(this.menuOverlay, 'open');
            }
            if (this.backdrop) {
                Utils.addClass(this.backdrop, 'open');
            }
            Utils.addClass(document.body, 'mobile-menu-open');
            
            // Add hamburger animation if present
            const hamburger = document.querySelector('#racc-mobile-menu-btn .hamburger-icon');
            if (hamburger) {
                Utils.addClass(hamburger, 'open');
            }
        },

        close: function() {
            this.isOpen = false;
            if (this.menuOverlay) {
                Utils.removeClass(this.menuOverlay, 'open');
            }
            if (this.backdrop) {
                Utils.removeClass(this.backdrop, 'open');
            }
            Utils.removeClass(document.body, 'mobile-menu-open');
            
            // Remove hamburger animation if present
            const hamburger = document.querySelector('#racc-mobile-menu-btn .hamburger-icon');
            if (hamburger) {
                Utils.removeClass(hamburger, 'open');
            }
        }
    };

    // User Menu Dropdown Manager (for desktop)
    const UserMenu = {
        init: function() {
            this.button = document.getElementById('user-menu-button');
            this.menu = document.getElementById('user-menu');
            this.isOpen = false;
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;

            // Toggle user menu
            document.addEventListener('click', function(e) {
                if (e.target.id === 'user-menu-button' || e.target.closest('#user-menu-button')) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggle();
                }
                // Close on outside click
                else if (self.menu && !e.target.closest('#user-menu') && self.isOpen) {
                    self.close();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', function(e) {
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
            if (this.menu) {
                Utils.removeClass(this.menu, 'hidden');
                Utils.addClass(this.menu, 'open');
            }
        },

        close: function() {
            this.isOpen = false;
            if (this.menu) {
                Utils.addClass(this.menu, 'hidden');
                Utils.removeClass(this.menu, 'open');
            }
        }
    };

    // Smooth Scroll Manager
    const SmoothScroll = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a[href^="#"]');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href.length > 1) { // More than just #
                        const target = document.querySelector(href);
                        if (target) {
                            e.preventDefault();
                            target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }
                }
            });
        }
    };

    // Header Scroll Effects
    const HeaderScroll = {
        init: function() {
            this.header = document.querySelector('header');
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;
            window.addEventListener('scroll', function() {
                self.updateHeader();
            });
        },

        updateHeader: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 10) {
                if (this.header) {
                    Utils.addClass(this.header, 'scrolled');
                }
            } else {
                if (this.header) {
                    Utils.removeClass(this.header, 'scrolled');
                }
            }
        }
    };

    // Button Animation Manager
    const ButtonAnimations = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            // Add hover effects to RACC buttons
            document.addEventListener('mouseenter', function(e) {
                if (e.target.classList.contains('racc-btn')) {
                    Utils.addClass(e.target, 'hover-effect');
                }
            }, true);

            document.addEventListener('mouseleave', function(e) {
                if (e.target.classList.contains('racc-btn')) {
                    Utils.removeClass(e.target, 'hover-effect');
                }
            }, true);
        }
    };

    // Authentication simulation (replace with real auth logic)
    const AuthManager = {
        init: function() {
            this.isAuthenticated = false; // Replace with real auth check
            this.updateUI();
        },

        updateUI: function() {
            const authOnlyElements = document.querySelectorAll('.auth-only');
            const guestOnlyElements = document.querySelectorAll('.guest-only');
            const mobileUserProfile = document.getElementById('mobile-user-profile');

            if (this.isAuthenticated) {
                // Show authenticated state
                authOnlyElements.forEach(el => el.style.display = 'block');
                guestOnlyElements.forEach(el => el.style.display = 'none');
                if (mobileUserProfile) {
                    Utils.removeClass(mobileUserProfile, 'hidden');
                }
            } else {
                // Show guest state
                authOnlyElements.forEach(el => el.style.display = 'none');
                guestOnlyElements.forEach(el => el.style.display = 'block');
                if (mobileUserProfile) {
                    Utils.addClass(mobileUserProfile, 'hidden');
                }
            }
        }
    };

    // Initialize everything when DOM is ready
    Utils.ready(function() {
        ThemeManager.init();
        MobileMenu.init();
        UserMenu.init();
        SmoothScroll.init();
        HeaderScroll.init();
        ButtonAnimations.init();
        AuthManager.init();

        // Console log for debugging
        console.log('RACC Template JavaScript initialized');
    });

    // Expose managers globally for debugging
    window.RACC = {
        ThemeManager: ThemeManager,
        MobileMenu: MobileMenu,
        UserMenu: UserMenu,
        SmoothScroll: SmoothScroll,
        HeaderScroll: HeaderScroll,
        ButtonAnimations: ButtonAnimations,
        AuthManager: AuthManager
    };

})();