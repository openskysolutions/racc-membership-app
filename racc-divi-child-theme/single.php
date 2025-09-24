<?php
/**
 * Template for displaying single blog posts
 */

get_header(); ?>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                <header class="entry-header mb-8">
                    <h1 class="entry-title text-3xl font-semibold text-foreground mb-4">
                        <?php the_title(); ?>
                    </h1>
                    <div class="entry-meta text-muted-foreground mb-4">
                        <time datetime="<?php echo get_the_date('c'); ?>">
                            <?php echo get_the_date(); ?>
                        </time>
                        <span class="mx-2">•</span>
                        <span class="author">By <?php the_author(); ?></span>
                        <?php if (has_category()) : ?>
                            <span class="mx-2">•</span>
                            <span class="categories">
                                <?php the_category(', '); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                </header>

                <div class="entry-content prose max-w-none">
                    <?php the_content(); ?>
                </div>

                <?php if (has_tag()) : ?>
                    <footer class="entry-footer mt-8 pt-4 border-t border-border">
                        <div class="tags">
                            <span class="text-sm font-medium">Tags: </span>
                            <?php the_tags('', ', ', ''); ?>
                        </div>
                    </footer>
                <?php endif; ?>
            </article>

            <!-- Post navigation -->
            <nav class="post-navigation mt-12 pt-8 border-t border-border">
                <div class="flex justify-between">
                    <div class="previous-post">
                        <?php previous_post_link('%link', '← %title'); ?>
                    </div>
                    <div class="next-post">
                        <?php next_post_link('%link', '%title →'); ?>
                    </div>
                </div>
            </nav>
        <?php endwhile; ?>
    </div>
</div>

<?php get_footer(); ?>