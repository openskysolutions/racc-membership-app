<?php
/**
 * Main template file
 * Displays the main content area
 */

// Debug output
echo '<!-- RACC Index Template Loaded -->';
echo '<script>console.log("RACC Index Template Loaded");</script>';

get_header(); ?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class('mb-8'); ?>>
                    <header class="entry-header mb-4">
                        <h1 class="entry-title text-2xl font-semibold mb-2">
                            <a href="<?php the_permalink(); ?>" class="text-foreground hover:text-highlight transition-colors">
                                <?php the_title(); ?>
                            </a>
                        </h1>
                        <div class="entry-meta text-sm text-muted-foreground">
                            <time datetime="<?php echo get_the_date('c'); ?>">
                                <?php echo get_the_date(); ?>
                            </time>
                            <span class="mx-1">•</span>
                            <span class="author">
                                By <?php the_author(); ?>
                            </span>
                        </div>
                    </header>

                    <div class="entry-content">
                        <?php the_excerpt(); ?>
                    </div>

                    <footer class="entry-footer mt-4">
                        <a href="<?php the_permalink(); ?>" class="racc-btn racc-btn-signin text-sm">
                            Read More
                        </a>
                    </footer>
                </article>
            <?php endwhile; ?>

            <!-- Pagination -->
            <nav class="pagination mt-8">
                <?php
                the_posts_pagination(array(
                    'prev_text' => '← Previous',
                    'next_text' => 'Next →',
                    'class' => 'flex justify-center gap-2'
                ));
                ?>
            </nav>
        <?php else : ?>
            <div class="no-posts text-center py-12">
                <h1 class="text-2xl font-semibold mb-4">Nothing Found</h1>
                <p class="text-muted-foreground">It looks like nothing was found at this location. Maybe try a search?</p>
                <?php get_search_form(); ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>