# WordPress Event Pages Setup

To mark pages as events in WordPress, you need to add a custom field called `is_event` to your pages. Here are several methods:

## Method 1: Using WordPress Custom Fields (Manual)

When editing a page in WordPress:

1. Scroll down to the **Custom Fields** section (if not visible, enable it in Screen Options at the top)
2. Add a new custom field:
   - **Name**: `is_event`
   - **Value**: `1`
3. Update/Publish the page

## Method 2: Add Meta Box in WordPress Admin (Automated)

Add this code to your WordPress theme's `functions.php` file or create a custom plugin:

```php
<?php
/**
 * Add Event checkbox to page editor
 */

// Add meta box to page editor
function racc_add_event_meta_box() {
    add_meta_box(
        'racc_event_meta_box',
        'Event Settings',
        'racc_event_meta_box_callback',
        'page',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'racc_add_event_meta_box');

// Meta box HTML
function racc_event_meta_box_callback($post) {
    wp_nonce_field('racc_save_event_meta', 'racc_event_meta_nonce');
    $is_event = get_post_meta($post->ID, 'is_event', true);
    ?>
    <label for="racc_is_event">
        <input 
            type="checkbox" 
            id="racc_is_event" 
            name="racc_is_event" 
            value="1" 
            <?php checked($is_event, '1'); ?>
        />
        Mark this page as an event
    </label>
    <?php
}

// Save meta box data
function racc_save_event_meta($post_id) {
    // Check nonce
    if (!isset($_POST['racc_event_meta_nonce']) || 
        !wp_verify_nonce($_POST['racc_event_meta_nonce'], 'racc_save_event_meta')) {
        return;
    }

    // Check autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    // Check permissions
    if (!current_user_can('edit_page', $post_id)) {
        return;
    }

    // Save or delete the meta
    if (isset($_POST['racc_is_event']) && $_POST['racc_is_event'] === '1') {
        update_post_meta($post_id, 'is_event', '1');
    } else {
        delete_post_meta($post_id, 'is_event');
    }
}
add_action('save_post_page', 'racc_save_event_meta');

/**
 * Make is_event field accessible via REST API
 */
function racc_register_event_meta() {
    register_post_meta('page', 'is_event', array(
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'default' => '0',
    ));
}
add_action('init', 'racc_register_event_meta');
```

## Method 3: Using Categories or Tags (Alternative)

If you prefer not to use custom fields, you can use a category or tag:

### Option A: Using Categories

1. Create a category called "Event" in WordPress
2. Assign pages to this category
3. Update the service to filter by category ID instead:

```typescript
// In wordpress.ts
export async function getWordPressEventPages(params?: {
  per_page?: number;
  page?: number;
  search?: string;
  orderby?: 'date' | 'title' | 'menu_order';
  order?: 'asc' | 'desc';
}) {
  const result = await getWordPressContent('pages', {
    ...params,
    categories: [YOUR_EVENT_CATEGORY_ID], // Replace with actual category ID
  });
  return {
    pages: result.items,
    total: result.total,
    totalPages: result.totalPages,
  };
}
```

## Method 4: Bulk Update Existing Pages

To mark multiple existing pages as events at once, use this PHP snippet (run once in functions.php or via wp-cli):

```php
<?php
/**
 * Bulk mark pages as events by page IDs
 * Add this temporarily to functions.php, load any admin page once, then remove it
 */
function racc_bulk_mark_events_once() {
    // Add your event page IDs here
    $event_page_ids = array(123, 456, 789);
    
    foreach ($event_page_ids as $page_id) {
        update_post_meta($page_id, 'is_event', '1');
    }
    
    // Uncomment to see confirmation
    // wp_die('Event pages marked! Remove this function from functions.php');
}
// Uncomment to run once:
// add_action('admin_init', 'racc_bulk_mark_events_once');
```

## Method 5: Bulk Update by Parent Page

If all your event pages are children of a specific parent page:

```php
<?php
/**
 * Automatically mark all child pages of a specific parent as events
 */
function racc_auto_mark_event_pages($post_id, $post, $update) {
    // Replace 123 with your parent page ID
    $event_parent_id = 123;
    
    if ($post->post_type === 'page' && $post->post_parent == $event_parent_id) {
        update_post_meta($post_id, 'is_event', '1');
    }
}
add_action('save_post', 'racc_auto_mark_event_pages', 10, 3);
```

## Verification

After marking pages as events, you can verify they're accessible via the REST API:

```
https://your-wordpress-site.com/wp-json/wp/v2/pages?meta_key=is_event&meta_value=1
```

## REST API Filtering Support

By default, WordPress REST API supports filtering by meta_key and meta_value. If it's not working, add this to functions.php:

```php
<?php
/**
 * Enable REST API meta query filtering
 */
function racc_enable_rest_meta_query($args, $request) {
    if (isset($request['meta_key']) && isset($request['meta_value'])) {
        $args['meta_key'] = $request['meta_key'];
        $args['meta_value'] = $request['meta_value'];
    }
    return $args;
}
add_filter('rest_page_query', 'racc_enable_rest_meta_query', 10, 2);
add_filter('rest_post_query', 'racc_enable_rest_meta_query', 10, 2);
```

## Recommended Approach

**Method 2** is recommended because:
- Clean UI in WordPress admin
- Easy for content editors to use
- No need to remember custom field names
- Properly exposes data via REST API
- Can be bulk updated if needed

After adding the code, you'll see an "Event Settings" checkbox in the sidebar when editing any page.
