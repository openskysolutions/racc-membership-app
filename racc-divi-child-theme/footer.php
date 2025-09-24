    </main>
    <!-- Footer exactly matching React Footer component -->
    <footer id="footer" class="racc-footer bg-card-foreground border-t-border border-t-1 text-stone-100 text-sm">
        <!-- <hr class="w-full mx-auto border-t-border mt-0" /> -->
        
        <section class="py-8 md:pt-4 grid grid-rows-2 grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-8 lg:gap-4 px-6">
            <!-- Logo Section -->
            <div class="rows-span-1 md:row-span-2 col-span-3 sm:col-span-3 md:col-span-2 justify-center items-center flex">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="flex w-48 h-auto justify-center items-center">
                    <img
                        src="<?php echo get_stylesheet_directory_uri(); ?>/images/racc-logo-dark.png"
                        alt="<?php bloginfo('name'); ?> Logo"
                        class="h-full w-full" 
                    />
                </a>
            </div>

            <!-- Description Section -->
            <div class="text-sm mt-6 my-4 row-span-1 col-span-full sm:cols-span-2 md:col-span-3 justify-center items-center item inline-flex">
                <p>
                    The Chamber of Commerce is an organization of businesses who have joined together for business promotion and information.
                    The Chamber is your business partner and resource.
                    <a href="<?php echo esc_url(home_url('/about')); ?>" class="text-nowrap highlight-link">
                        Learn more
                    </a>
                </p>
            </div>
            
            <div class="hidden flex-col md:col-span-2" />

            <!-- Platforms Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium text-md">Platforms</h3>
                <div>
                    <a href="#" class="opacity-60 hover:opacity-100">
                        Web
                    </a>
                </div>
                <div>
                    <a href="#" class="opacity-60 hover:opacity-100">
                        Mobile
                    </a>
                </div>
            </div>

            <!-- About Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium">About</h3>
                <div>
                    <a href="#" class="opacity-60 hover:opacity-100">
                        Benefits
                    </a>
                </div>
                <div>
                    <a href="#" class="opacity-60 hover:opacity-100">
                        Pricing
                    </a>
                </div>
                <div>
                    <a href="#" class="opacity-60 hover:opacity-100">
                        FAQ
                    </a>
                </div>
            </div>

            <!-- Community Column -->
            <div class="flex flex-col col-span-1 text-sm">
                <h3 class="font-medium text-md">Community</h3>
                <div>
                    <a href="https://www.facebook.com/profile.php?id=100063232268373" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="opacity-60 hover:opacity-100">
                        Facebook
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer Bottom Copyright Section -->
        <section class="container pb-4 text-stone-100 text-center text-xs px-3">
            <h3 class="text-center text-stone-100 text-xs">
                Copyright &copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>
                |
                <a href="<?php echo esc_url(home_url('/privacy')); ?>" class="highlight-link hover:no-underline hover:border-b-0">
                    Privacy
                </a>
                |
                <a href="<?php echo esc_url(home_url('/terms')); ?>" class="highlight-link hover:no-underline hover:border-b-0">
                    Terms
                </a>
                |
                <span class="text-nowrap">
                    Powered by
                    <a href="https://monroemountainmarketing.com/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="highlight-link hover:no-underline hover:border-b-0">
                        Monroe Moutain Marketing
                    </a>
                </span>
            </h3>
        </section>
    </footer>

</div> <!-- End page-container -->

<?php wp_footer(); ?>
</body>
</html>