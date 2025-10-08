<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<div id="page-container" class="flex flex-col min-h-screen">

<!-- Main Header exactly matching React Header component -->
<header id="header" class="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-popover dark:bg-accent-foreground shadow-md">
    <!-- Main Navigation -->
    <nav class="mx-auto">
        <div class="container h-20 px-4 w-screen flex justify-between">
            <!-- Logo Section -->
            <a href="https://richfieldareachamber.com" class="flex flex-row flex-grow flex-shrink-0 h-20 py-1 justify-center md:justify-start ml-10 md:ml-0">
                <?php 
                $logo_url = get_theme_mod('racc_logo_setting');
                if ($logo_url) {
                    echo '<img src="' . esc_url($logo_url) . '" alt="' . esc_attr(get_bloginfo('name')) . ' Logo" class="h-full w-auto p-1" />';
                } else {
                    // Fallback to theme logo
                    echo '<img src="' . get_stylesheet_directory_uri() . '/images/racc-logo.png" alt="' . esc_attr(get_bloginfo('name')) . ' Logo" class="h-full w-auto p-1" />';
                }
                ?>
            </a>

            <!-- Desktop Right Side Actions -->
            <div class="md:order-2 gap-2 items-center ml-3 hidden md:inline-flex">
                <!-- Nominations Button -->
                <button onclick="window.location.href='<?php echo esc_url('members.richfieldareachamber.com/nominations'); ?>'" class="btn btn-sm bg-card-foreground dark:bg-card-foreground text-card">
                    Nominations
                </button>

                <!-- Join Now Button (show when not authenticated) -->
                <button onclick="window.location.href='<?php echo esc_url(home_url('/join-now')); ?>'" class="btn btn-sm bg-highlight-foreground hover:bg-highlight-foreground/90 text-card">
                    Join Now
                </button>

                <!-- Sign In Button (show when not authenticated) -->
                <button onclick="window.location.href='<?php echo esc_url('members.richfieldareachamber.com/login'); ?>'" class="btn btn-sm btn-ghost">
                    Sign in
                </button>
            </div>

            <!-- Mobile Menu Button -->
            <div class="flex md:hidden items-center">
                <button id="mobile-menu-button">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                    <span class="sr-only">Menu</span>
                </button>
            </div>
        </div>
    </nav>

    <!-- Desktop Secondary Navigation (matching React component structure) -->
    <nav class="hidden md:flex max-w-full w-full bg-background border-t border-t-border dark:bg-neutral-800 dark:border-t-popover">
        <div class="container h-10 px-0 w-screen flex justify-around items-center">
            <?php
            // Check if WordPress menu exists, otherwise use fallback
            if (has_nav_menu('primary')) {
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'container' => false,
                    'menu_class' => 'container h-10 px-0 w-screen flex justify-around items-center',
                    'items_wrap' => '%3$s',
                    'fallback_cb' => false,
                    'walker' => new class extends Walker_Nav_Menu {
                        public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
                            $output .= '<a href="' . esc_url($item->url) . '" class="px-1 py-1 h-6 hover:bg-highlight-foreground rounded-md">';
                            $output .= esc_html($item->title);
                            $output .= '</a>';
                        }
                    }
                ));
            } 
            else {
                // Fallback menu items
                $menu_items = array(
                    array('href' => '/news-events', 'label' => 'News & Events'),
                    array('href' => '/calendar', 'label' => 'Calendar'),
                    array('href' => '/members', 'label' => 'Members'),
                    array('href' => '/job-postings', 'label' => 'Job Postings'),
                    array('href' => '/contact', 'label' => 'Contact'),
                    array('href' => '/about', 'label' => 'About'),
                );
                
                foreach ($menu_items as $item) {
                    echo '<a href="' . esc_url(home_url($item['href'])) . '" class="px-2 py-1 h-6 text-foreground racc-subnav-link-color rounded-md transition-colors ring-offset-background font-medium text-sm whitespace-nowrap gap-2 justify-center items-center inline-flex">';
                    echo esc_html($item['label']);
                    echo '</a>';
                }
            }
            ?>
        </div>
    </nav>
</header>

<!-- Mobile Menu Drawer (exactly matching React Sheet component) -->
<div id="mobile-menu-drawer" class="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden flex flex-col border-r-1 border-r-stone-400">
    <!-- Sheet Header -->
    <div class="p-4 ">
        <div class="font-medium text-md items-center flex flex-col border-b-1 border-b-stone-300 dark:border-b-stone-400 pb-2 relative">
            <a href="https://richfieldareachamber.com" class="flex flex-row flex-grow flex-shrink-0 h-20 py-1 justify-center md:justify-start ml-10 md:ml-0">
                <?php 
                $logo_url = get_theme_mod('racc_logo_setting');
                if ($logo_url) {
                    echo '<img src="' . esc_url($logo_url) . '" alt="' . esc_attr(get_bloginfo('name')) . ' Logo" class="h-full w-auto p-1" />';
                } else {
                    // Fallback to theme logo
                    echo '<img src="' . get_stylesheet_directory_uri() . '/images/racc-logo.png" alt="' . esc_attr(get_bloginfo('name')) . ' Logo" class="h-full w-auto p-1" />';
                }
                ?>
            </a>
            <button class="absolute top-2 right-2 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" id="mobile-menu-close">×</button>
        </div>
    </div>

    <!-- Navigation Items -->
    <nav class="flex flex-col justify-start items-start px-4 flex-1">
      <?php
        // Check if WordPress menu exists, otherwise use fallback
        if (has_nav_menu('primary')) {
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'container' => false,
                'menu_class' => 'flex flex-col space-y-2 w-full',
                'items_wrap' => '<div class="flex flex-col space-y-2 w-full">%3$s</div>',
                'fallback_cb' => false,
                'walker' => new class extends Walker_Nav_Menu {
                    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
                        $output .= '<a href="' . esc_url($item->url) . '" class="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">';
                        $output .= esc_html($item->title);
                        $output .= '</a>';
                    }
                }
            ));
        } else {
            // Fallback menu items for mobile
            $menu_items = array(
                array('href' => '/news-events', 'label' => 'News & Events'),
                array('href' => '/calendar', 'label' => 'Calendar'),
                array('href' => '/members', 'label' => 'Members'),
                array('href' => '/job-postings', 'label' => 'Job Postings'),
                array('href' => '/contact', 'label' => 'Contact'),
                array('href' => '/about', 'label' => 'About'),
            );
            
            echo '<div class="flex flex-col space-y-2 w-full">';
            foreach ($menu_items as $item) {
                echo '<a href="' . esc_url(home_url($item['href'])) . '" class="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">';
                echo esc_html($item['label']);
                echo '</a>';
            }
            echo '</div>';
        }
      ?>
    </nav>

    <!-- Spacer to push footer content to bottom -->
    <div class="flex-grow"></div>

    <!-- Footer Actions - matching React exactly -->
    <div class="p-4 space-y-2 pb-8">
      <!-- Nominations Button -->
      <button onclick="window.location.href='<?php echo esc_url('members.richfieldareachamber.com/nominations'); ?>'" class="btn btn-sm bg-card-foreground dark:bg-card-foreground text-card w-full">
          Nominations
      </button>

      <!-- Join Now Button (show when not authenticated) -->
      <button onclick="window.location.href='<?php echo esc_url(home_url('/join-now')); ?>'" class="btn btn-sm bg-highlight-foreground hover:bg-highlight-foreground/90 text-card w-full">
          Join Now
      </button>

      <!-- Sign In Button (show when not authenticated) -->
      <button onclick="window.location.href='<?php echo esc_url('members.richfieldareachamber.com/login'); ?>'" class="btn btn-sm btn-ghost w-full">
          Sign in
      </button>
    </div>
</div>

<!-- Mobile Menu Overlay -->
<div id="mobile-menu-overlay" class="fixed inset-0 z-40 bg-black bg-opacity-50 opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out md:hidden"></div>

<!-- Main Content Area -->
<main id="main" class="flex flex-grow">