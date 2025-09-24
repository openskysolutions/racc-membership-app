<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<div id="page-container" class="flex flex-col min-h-screen">

<header class="sticky border-b top-0 z-40 w-full bg-white shadow-md">
    <!-- Main Navigation Container -->
    <nav class="mx-auto">
        <ul class="container h-20 px-4 w-screen flex justify-between items-center">
            <!-- Logo Section -->
            <li>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="flex flex-row flex-grow flex-shrink-0 h-20 py-1 justify-center md:justify-start ml-10 md:ml-0">
                    <img 
                        src="<?php echo get_stylesheet_directory_uri(); ?>/images/racc-logo.png" 
                        alt="<?php bloginfo('name'); ?> Logo"
                        class="h-full w-auto p-1"
                    />
                </a>
            </li>

            <!-- Desktop Right Side Actions -->
            <li class="md:order-2 gap-2 items-center ml-3 hidden md:inline-flex">
                <!-- Nominations Button -->
                <a href="<?php echo esc_url(home_url('/nominations')); ?>" class="racc-btn racc-btn-nominations">
                    Nominations
                </a>

                <!-- Join Now Button (show when not authenticated) -->
                <a href="<?php echo esc_url(home_url('/join')); ?>" class="racc-btn racc-btn-join">
                    Join Now
                </a>

                <!-- Sign In Button (show when not authenticated) -->
                <a href="<?php echo esc_url(home_url('/auth')); ?>" class="racc-btn racc-btn-signin">
                    Sign in
                </a>
            </li>

            <!-- Mobile Menu Button -->
            <li class="flex md:hidden">
                <button class="px-2" id="mobile-menu-button">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                    <span class="sr-only">Menu</span>
                </button>
            </li>
        </ul>
    </nav>

    <!-- Desktop Secondary Navigation (exactly matching React component) -->
    <nav class="hidden md:flex max-w-full w-full bg-background border-t">
        <ul class="container h-10 px-0 w-screen flex justify-around items-center">
            <?php
            // Navigation menu items exactly matching React routeList
            $menu_items = array(
                array('href' => '/news-events', 'label' => 'News & Events'),
                array('href' => '/calendar', 'label' => 'Calendar'),
                array('href' => '/members', 'label' => 'Members'),
                array('href' => '/job-postings', 'label' => 'Jobs Postings'),
                array('href' => '/contact', 'label' => 'Contact'),
                array('href' => '/about', 'label' => 'About'),
            );

            // Check if WordPress menu exists, otherwise use fallback
            if (has_nav_menu('primary')) {
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'container' => false,
                    'menu_class' => 'flex justify-around items-center w-full',
                    'items_wrap' => '%3$s',
                    'fallback_cb' => false,
                ));
            } else {
                // Fallback menu matching React component exactly
                foreach ($menu_items as $item) {
                    echo '<li>';
                    echo '<a href="' . esc_url(home_url($item['href'])) . '" class="px-1 py-1 text-foreground hover:bg-highlight-foreground rounded-md text-sm transition-colors">';
                    echo esc_html($item['label']);
                    echo '</a>';
                    echo '</li>';
                }
            }
            ?>
        </ul>
    </nav>
</header>

<!-- Mobile Menu Drawer (exactly matching React Sheet component) -->
<div class="racc-mobile-menu-drawer fixed top-0 left-0 h-full w-80 bg-white transform -translate-x-full z-50 border-r flex flex-col transition-transform" id="mobile-menu-drawer">
    <!-- Mobile Menu Content -->
    <div class="flex-1 p-4">
        <!-- Mobile Header with Logo -->
        <div class="flex items-center justify-between border-b pb-2 mb-4">
            <img 
                src="<?php echo get_stylesheet_directory_uri(); ?>/images/racc-logo.png" 
                alt="<?php bloginfo('name'); ?> Logo"
                class="h-16 w-auto p-1"
            />
            <button class="text-2xl" id="mobile-menu-close">×</button>
        </div>

        <!-- User Profile Section (when authenticated) -->
        <div class="border-b border-stone-300 py-2 mb-4 hidden" id="mobile-user-profile">
            <div class="text-sm font-semibold">User Name</div>
            <div class="text-sm text-muted-foreground truncate">user@example.com</div>
        </div>

        <!-- Mobile Navigation Links -->
        <nav class="flex flex-col">
            <?php
            foreach ($menu_items as $item) {
                echo '<a href="' . esc_url(home_url($item['href'])) . '" class="border-b border-stone-300 text-sm rounded-none w-full py-2 block transition-colors hover:bg-highlight-foreground">';
                echo esc_html($item['label']);
                echo '</a>';
            }
            ?>
        </nav>
    </div>

    <!-- Mobile Menu Footer Actions -->
    <div class="p-4 space-y-2">
        <!-- Action Buttons -->
        <a href="<?php echo esc_url(home_url('/nominations')); ?>" class="racc-btn bg-card-foreground text-card w-full text-center block">
            Nominations
        </a>
        <a href="<?php echo esc_url(home_url('/join')); ?>" class="racc-btn bg-highlight-foreground text-white w-full text-center block">
            Join Now
        </a>
        <a href="<?php echo esc_url(home_url('/auth')); ?>" class="racc-btn racc-btn-signin w-full text-center block">
            Member Login
        </a>

        <!-- Theme Toggle -->
        <div class="flex justify-between items-center w-full py-4 border-t border-stone-300">
            <span class="text-sm">Toggle theme</span>
            <button class="racc-theme-toggle" id="mobile-theme-toggle">
                <span class="theme-icon">🌙</span>
            </button>
        </div>
    </div>
</div>

<!-- Mobile Menu Overlay -->
<div class="racc-mobile-menu-overlay fixed inset-0 bg-black bg-opacity-50 z-40 hidden" id="mobile-menu-overlay"></div>

<!-- Main Content Area -->
<main id="main" class="flex flex-grow">