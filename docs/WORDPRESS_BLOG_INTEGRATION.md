# WordPress Blog Integration

This application includes a WordPress blog integration that fetches and displays blog posts from a WordPress site using the WordPress REST API.

## Features

- **Blog Listing Page** (`/blog`): Displays all published posts in a grid layout
- **Blog Post Detail Page** (`/blog/:slug`): Shows individual blog posts with full content
- **Search**: Search for posts by keywords
- **Pagination**: Navigate through multiple pages of posts
- **Featured Images**: Automatically displays featured images if set
- **Author Information**: Shows author name and avatar
- **Categories & Tags**: Displays post categories and tags
- **Responsive Design**: Mobile-friendly layout

## Setup

### 1. Configure WordPress URL

Add your WordPress site URL to the `.env` file:

```env
VITE_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
```

Replace `https://your-wordpress-site.com` with your actual WordPress site URL.

### 2. WordPress REST API Requirements

The WordPress REST API is enabled by default in WordPress 4.7+. No additional plugins are required for basic post fetching.

#### CORS Configuration (if needed)

If your WordPress site is on a different domain than your app, you may need to enable CORS. Add this to your WordPress theme's `functions.php`:

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

**Note**: For production, replace `*` with your specific domain for better security.

### 3. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/blog` to see the blog listing
3. Click on any post to view the full content

## API Service

The WordPress integration is handled by `/src/services/wordpress.ts`, which provides:

### Functions

- **`getWordPressPosts(params?)`**: Fetch all published posts
  - Supports pagination, search, filtering by category/tag/author
  - Returns posts with embedded data (featured images, authors)
  
- **`getWordPressPostBySlug(slug)`**: Fetch a single post by slug
  
- **`getWordPressPostById(id)`**: Fetch a single post by ID
  
- **`getWordPressCategories(params?)`**: Fetch all categories
  
- **`getWordPressAuthors(params?)`**: Fetch all authors

### Example Usage

```typescript
import { getWordPressPosts, getWordPressPostBySlug } from '@/services/wordpress';

// Fetch posts
const { posts, total, totalPages } = await getWordPressPosts({
  page: 1,
  per_page: 10,
  search: 'my search term',
});

// Fetch a single post
const post = await getWordPressPostBySlug('my-post-slug');
```

## Pages

### Blog Listing (`/src/pages/Blog.tsx`)

Features:
- Grid layout showing post excerpts
- Search functionality
- Pagination controls
- Featured images
- Author and date information

### Blog Post Detail (`/src/pages/BlogPost.tsx`)

Features:
- Full post content rendering
- Featured image display
- Author information with avatar
- Categories and tags
- Back to blog navigation
- Formatted dates

## Styling

Both pages use:
- Tailwind CSS for styling
- shadcn/ui components (Card, Button, Badge, etc.)
- Responsive design with mobile-first approach
- Dark mode support through `prose-invert`

## Customization

### Modify Post Display

Edit `/src/pages/Blog.tsx` or `/src/pages/BlogPost.tsx` to customize:
- Layout and styling
- Number of posts per page
- Post excerpt length
- Metadata displayed

### Add Additional Filtering

The WordPress REST API supports many parameters. You can extend the service to add:
- Filter by category
- Filter by tag
- Filter by date range
- Order by different fields

Example:
```typescript
const { posts } = await getWordPressPosts({
  categories: [1, 2, 3], // Filter by category IDs
  orderby: 'title',      // Order by title instead of date
  order: 'asc',          // Ascending order
});
```

## Navigation

To add the blog to your main navigation, add a link to `/blog` in your navigation component.

## WordPress Content Styling

The blog post content uses the `prose` class from `@tailwindcss/typography`. Make sure this plugin is installed:

```bash
npm install -D @tailwindcss/typography
```

Then add it to your `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

## Security Notes

1. The WordPress REST API is read-only by default for unauthenticated users
2. Only published posts are fetched
3. Private or draft posts are not accessible without authentication
4. For production, consider implementing rate limiting and caching

## Troubleshooting

### Posts not loading

1. Check that your WordPress URL is correct in `.env`
2. Verify the WordPress REST API is accessible at: `https://your-site.com/wp-json/wp/v2/posts`
3. Check browser console for CORS errors
4. Ensure WordPress site is publicly accessible

### Images not displaying

1. Check that posts have featured images set in WordPress
2. Verify image URLs are publicly accessible
3. Check WordPress media settings

### Styling issues

1. Ensure `@tailwindcss/typography` is installed
2. Check that dark mode classes are properly configured
3. Verify WordPress content doesn't have conflicting inline styles
