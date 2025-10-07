<?php
  /**
   * Footer template
   */
?>
</main>
    <!-- Footer exactly matching React Footer component -->
    <footer id="footer" class="border-t border-t-border dark:border-b-ring bg-card-foreground dark:bg-accent-foreground text-stone-100 text-sm">
        <section class="py-8 md:pt-0 grid grid-rows-2 grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-8 lg:gap-4 px-6">
            <!-- Logo Section -->
            <div class="row-span-1 md:row-span-2 col-span-3 sm:col-span-3 md:col-span-2 justify-center items-center flex">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="flex w-48 h-auto justify-center items-center">
                    <img src="<?php echo get_stylesheet_directory_uri(); ?>/images/racc-logo-dark.png" alt="<?php echo esc_attr(get_bloginfo('name')); ?> Logo" class="h-full w-full" />
                </a>
            </div>

            <!-- Description Section -->
            <div class="text-sm mt-6 md:pt-12 my-4 mr-12 dark:text-neutral-350 row-span-1 col-span-full sm:col-span-3 md:col-span-3 justify-center items-center inline-flex">
                <p>
                    <?php echo esc_html(get_theme_mod('racc_footer_description', 'The Chamber of Commerce is an organization of businesses who have joined together for business promotion and information. The Chamber is your business partner and resource.')); ?>
                    <a href="<?php echo esc_url(home_url('/about')); ?>" class="text-nowrap text-highlight hover:text-highlight-foreground">
                        Learn more
                    </a>
                </p>

            </div>
            
            <div class="hidden flex-col md:col-span-2" ></div>  

            <!-- Platforms Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium text-sm text-stone-100 pb-2">Membership</h3>
                <div class="flex flex-col">
                    <?php
                    if (has_nav_menu('footer_platforms')) {
                        wp_nav_menu(array(
                            'theme_location' => 'footer_platforms',
                            'container' => false,
                            'items_wrap' => '%3$s',
                        ));
                    } else {
                        // Fallback links
                        echo '<a href="#" class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">Web</a>';
                        echo '<a href="#" class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">Mobile</a>';
                    }
                    ?>
                </div>
            </div>

            <!-- About Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium text-sm text-stone-100 pb-2">About</h3>
                <div class="flex flex-col">
                    <?php
                    if (has_nav_menu('footer_about')) {
                        wp_nav_menu(array(
                            'theme_location' => 'footer_about',
                            'container' => false,
                            'items_wrap' => '%3$s',
                        ));
                    } else {
                        // Fallback links
                        echo '<a href="#"class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">Benefits</a>';
                        echo '<a href="#"class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">Pricing</a>';
                        echo '<a href="#"class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">FAQ</a>';
                    }
                    ?>
                </div>
            </div>

            <!-- Community Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium text-sm text-stone-100 pb-2">Community</h3>
                <div class="flex flex-col">
                    <?php
                    if (has_nav_menu('footer_community')) {
                        wp_nav_menu(array(
                            'theme_location' => 'footer_community',
                            'container' => false,
                            'items_wrap' => '%3$s',
                        ));
                    } else {
                        // Fallback links
                        echo '<a href="https://www.facebook.com/profile.php?id=100063232268373" target="_blank" rel="noopener noreferrer" class="text-highlight hover:text-highlight underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all opacity-60 hover:opacity-100">Facebook</a>';
                    }
                    ?>
                </div>
            </div>
        </section>

        <!-- Footer Bottom Copyright Section -->
        <section class="container pb-4 text-card text-center text-xs px-3">
            <h3 class="text-center text-card text-xs">
                <?php echo esc_html(get_theme_mod('racc_footer_copyright', 'Copyright © ' . date('Y') . ' ' . get_bloginfo('name'))); ?>
                |
                <a href="<?php echo esc_url(home_url('/privacy')); ?>" class="text-highlight hover:text-highlight-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all">
                    Privacy
                </a>
                |
                <a href="<?php echo esc_url(home_url('/terms')); ?>" class="text-highlight hover:text-highlight-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all">
                    Terms
                </a>
                |
                <span class="text-nowrap">
                    Powered by
                    <a href="https://openskydev.com/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="text-highlight hover:text-highlight-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid transition-all">
                        Open Sky Solutions
                    </a>
                </span>
            </h3>
        </section>
    </footer>

</div> <!-- End page-container -->

<?php wp_footer(); ?>
</body>
</html>