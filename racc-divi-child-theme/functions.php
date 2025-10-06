<?php
/**
 * RACC Divi Child Theme Functions
 * Exactly matching React RACC membership app functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme setup
 */
function racc_divi_child_setup() {
    // Add theme support for various features
    add_theme_support('custom-logo');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => esc_html__('Primary Menu', 'racc-divi-child'),
        'mobile' => esc_html__('Mobile Menu', 'racc-divi-child'),
    ));
}
add_action('after_setup_theme', 'racc_divi_child_setup');

/**
 * Enqueue styles and scripts
 */
function racc_divi_child_enqueue_styles() {
    // Get theme version for cache busting
    $theme_version = filemtime(get_stylesheet_directory() . '/style.css');
    
    // Enqueue parent theme stylesheet
    wp_enqueue_style('divi-parent-style', get_template_directory_uri() . '/style.css');
    
    // Enqueue child theme stylesheet with proper dependencies
    wp_enqueue_style(
        'racc-divi-child-style', 
        get_stylesheet_directory_uri() . '/style.css', 
        array('divi-parent-style'), 
        $theme_version
    );
    
    // Enqueue custom JavaScript
    wp_enqueue_script(
        'racc-divi-child-script', 
        get_stylesheet_directory_uri() . '/js/racc-theme.js', 
        array('jquery'), 
        $theme_version, 
        true
    );
    
    // Localize script for AJAX
    wp_localize_script('racc-divi-child-script', 'racc_ajax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('racc_nonce'),
        'home_url' => home_url('/'),
    ));
}
add_action('wp_enqueue_scripts', 'racc_divi_child_enqueue_styles', 20);

/**
 * Override Divi templates completely
 */
function racc_override_divi_templates() {
    // Force use of our custom header and footer
    add_filter('show_admin_bar', '__return_false');
    
    // Remove all Divi actions that might interfere
    remove_all_actions('et_header_top');
    remove_all_actions('et_footer_top'); 
    remove_all_actions('et_html_main_element');
    
    // Ensure our templates load
    add_filter('template_include', 'racc_force_custom_template', 99);
}
add_action('after_setup_theme', 'racc_override_divi_templates', 11);

/**
 * Force our custom templates to load
 */
function racc_force_custom_template($template) {
    // Always use our index.php for all pages to ensure consistency
    $custom_template = get_stylesheet_directory() . '/index.php';
    if (file_exists($custom_template)) {
        return $custom_template;
    }
    return $template;
}

/**
 * Custom body classes for our theme
 */
function racc_body_classes($classes) {
    $classes[] = 'racc-theme';
    
    // Add dark mode class if needed (you can extend this with user preferences)
    if (isset($_COOKIE['racc_theme']) && $_COOKIE['racc_theme'] === 'dark') {
        $classes[] = 'dark';
    }
    
    return $classes;
}
add_filter('body_class', 'racc_body_classes');

/**
 * AJAX handler for theme toggle
 */
function racc_toggle_theme() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'racc_nonce')) {
        wp_die('Security check failed');
    }
    
    $theme = sanitize_text_field($_POST['theme']);
    
    // Set cookie for theme preference
    setcookie('racc_theme', $theme, time() + (86400 * 30), '/'); // 30 days
    
    wp_send_json_success(array('theme' => $theme));
}
add_action('wp_ajax_racc_toggle_theme', 'racc_toggle_theme');
add_action('wp_ajax_nopriv_racc_toggle_theme', 'racc_toggle_theme');

/**
 * Optimize WordPress for our theme
 */
function racc_optimize_wp() {
    // Remove unnecessary WordPress features
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
    
    // Clean up the head
    remove_action('wp_head', 'wp_shortlink_wp_head');
    remove_action('wp_head', 'adjacent_posts_rel_link_wp_head');
}
add_action('init', 'racc_optimize_wp');

/**
 * WordPress Customizer Support
 */
function racc_customize_register($wp_customize) {
    // RACC Logo Section
    $wp_customize->add_section('racc_logo_section', array(
        'title'    => __('RACC Logo Settings', 'racc-divi-child'),
        'priority' => 30,
    ));

    // Header Logo
    $wp_customize->add_setting('racc_header_logo', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));

    $wp_customize->add_control(new WP_Customize_Media_Control($wp_customize, 'racc_header_logo', array(
        'label'       => __('Header Logo', 'racc-divi-child'),
        'description' => __('Upload your header logo image', 'racc-divi-child'),
        'section'     => 'racc_logo_section',
        'mime_type'   => 'image',
    )));

    // Footer Logo
    $wp_customize->add_setting('racc_footer_logo', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));

    $wp_customize->add_control(new WP_Customize_Media_Control($wp_customize, 'racc_footer_logo', array(
        'label'       => __('Footer Logo', 'racc-divi-child'),
        'description' => __('Upload your footer logo image', 'racc-divi-child'),
        'section'     => 'racc_logo_section',
        'mime_type'   => 'image',
    )));

    // RACC Footer Section
    $wp_customize->add_section('racc_footer_section', array(
        'title'    => __('RACC Footer Settings', 'racc-divi-child'),
        'priority' => 35,
    ));

    // Footer Description
    $wp_customize->add_setting('racc_footer_description', array(
        'default'           => 'The Chamber of Commerce is an organization of businesses who have joined together for business promotion and information. The Chamber is your business partner and resource.',
        'sanitize_callback' => 'sanitize_textarea_field',
    ));

    $wp_customize->add_control('racc_footer_description', array(
        'label'   => __('Footer Description', 'racc-divi-child'),
        'section' => 'racc_footer_section',
        'type'    => 'textarea',
    ));

    // Footer Copyright Text
    $wp_customize->add_setting('racc_footer_copyright', array(
        'default'           => 'Copyright © ' . date('Y') . ' Richfield Area Chamber of Commerce',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    $wp_customize->add_control('racc_footer_copyright', array(
        'label'   => __('Footer Copyright Text', 'racc-divi-child'),
        'section' => 'racc_footer_section',
        'type'    => 'text',
    ));

    // Footer Links - Platforms Column
    $wp_customize->add_setting('racc_footer_platforms_title', array(
        'default'           => 'Platforms',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    $wp_customize->add_control('racc_footer_platforms_title', array(
        'label'   => __('Platforms Column Title', 'racc-divi-child'),
        'section' => 'racc_footer_section',
        'type'    => 'text',
    ));

    // Footer Links - About Column
    $wp_customize->add_setting('racc_footer_about_title', array(
        'default'           => 'About',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    $wp_customize->add_control('racc_footer_about_title', array(
        'label'   => __('About Column Title', 'racc-divi-child'),
        'section' => 'racc_footer_section',
        'type'    => 'text',
    ));

    // Footer Links - Community Column
    $wp_customize->add_setting('racc_footer_community_title', array(
        'default'           => 'Community',
        'sanitize_callback' => 'sanitize_text_field',
    ));

    $wp_customize->add_control('racc_footer_community_title', array(
        'label'   => __('Community Column Title', 'racc-divi-child'),
        'section' => 'racc_footer_section',
        'type'    => 'text',
    ));
}
add_action('customize_register', 'racc_customize_register');

/**
 * Register footer menu areas
 */
function racc_register_footer_menus() {
    register_nav_menus(array(
        'footer_platforms' => __('Footer Platforms Menu', 'racc-divi-child'),
        'footer_about'     => __('Footer About Menu', 'racc-divi-child'),
        'footer_community' => __('Footer Community Menu', 'racc-divi-child'),
    ));
}
add_action('after_setup_theme', 'racc_register_footer_menus');

/**
 * Custom walker for footer menus
 */
class RACC_Footer_Walker extends Walker_Nav_Menu {
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $output .= '<a href="' . esc_url($item->url) . '" style="color: rgb(245, 245, 244); text-decoration: none; opacity: 0.6; transition: opacity 0.2s; display: block; margin-bottom: 0.25rem;" class="hover:opacity-100">';
        $output .= esc_html($item->title);
        $output .= '</a>';
    }
}