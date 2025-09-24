<?php
/**
 * Template for displaying single pages
 */

get_header(); ?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                <header class="entry-header mb-8">
                    <h1 class="entry-title text-3xl font-semibold text-foreground">
                        <?php the_title(); ?>
                    </h1>
                </header>

                <div class="entry-content prose max-w-none">
                    <?php the_content(); ?>
                </div>

                <?php if (get_edit_post_link()) : ?>
                    <footer class="entry-footer mt-8 pt-4 border-t border-border">
                        <?php edit_post_link('Edit this page', '<span class="edit-link text-sm">', '</span>'); ?>
                    </footer>
                <?php endif; ?>
            </article>
        <?php endwhile; ?>
    </div>
</div>

<?php get_footer(); ?>