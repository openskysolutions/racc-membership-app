# WordPress Content Styling Guide

The WordPress/Divi content is styled using custom Tailwind CSS classes that match the rest of your application's design system.

## CSS Class: `.wp-content`

All WordPress content should be wrapped in a container with the `wp-content` class. This applies consistent styling that:

- Matches your site's color scheme (using CSS variables)
- Works with both light and dark modes
- Provides responsive typography
- Handles Divi Builder elements gracefully

## Features

### Typography
- **Headings**: Styled with your site's foreground color, proper spacing, and responsive sizing
- **Paragraphs**: Comfortable line height and spacing for readability
- **Links**: Uses primary color with hover effects
- **Lists**: Proper indentation and spacing

### Content Elements
- **Images**: Rounded corners, full width responsive, proper spacing
- **Blockquotes**: Border accent with primary color
- **Code blocks**: Muted background with proper formatting
- **Tables**: Bordered with alternating row colors

### Divi Builder Support
- **Buttons**: Automatically styled to match your site's button design
- **Sections/Rows**: Proper spacing and structure
- **Images**: Responsive and properly sized

## Usage in React

```tsx
<div
  className="wp-content mb-8"
  dangerouslySetInnerHTML={{ __html: post.rendered_content }}
/>
```

## Customization

The styles are defined in `src/App.css` and use Tailwind's `@apply` directive with your theme variables:

- `--foreground`: Main text color
- `--primary`: Accent/link color
- `--muted-foreground`: Secondary text
- `--border`: Border colors
- `--muted`: Background for code/tables

### Override Specific Elements

If you need to override specific Divi elements, add custom rules in `App.css`:

```css
.wp-content .et_pb_custom_class {
  @apply your-custom-styles;
}
```

### Inline Style Override

The CSS includes overrides for Divi's inline color and background styles:

```css
.wp-content [style*="color"] {
  color: inherit !important;
}
```

If you need certain elements to keep their inline styles, add more specific selectors:

```css
.wp-content .et_pb_section[style*="background"] {
  @apply rounded-lg p-6 my-6;
}
```

## Dark Mode

All styles automatically adapt to dark mode using your CSS variables. The colors will switch based on the `dark` class on your root element.

## Responsive Design

- Typography scales from base to larger sizes on md+ screens
- Images are fully responsive
- Tables will scroll horizontally on mobile if needed
- Spacing adjusts based on screen size

## Best Practices

1. **Always use `rendered_content`**: This field has Divi shortcodes processed into HTML
2. **Keep the wrapper simple**: Don't add additional styling that might conflict
3. **Test both modes**: Verify content looks good in light and dark mode
4. **Mobile first**: Check how content renders on different screen sizes

## Troubleshooting

### Colors look wrong
- Verify CSS variables are defined in `App.css`
- Check if Divi is adding inline styles that override

### Layout breaks
- Look for Divi columns that need width constraints
- Add max-width if needed: `.wp-content { @apply max-w-4xl; }`

### Images too large
- Images automatically size to container width
- If needed, add: `.wp-content img { @apply max-w-2xl; }`

### Buttons don't match
- Check if Divi is using custom button classes
- Add specific overrides for those classes

## Additional Divi Elements

If you encounter other Divi elements that need styling, add them to `App.css`:

```css
.wp-content .et_pb_video {
  @apply aspect-video rounded-lg overflow-hidden my-6;
}

.wp-content .et_pb_gallery {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4 my-6;
}

.wp-content .et_pb_testimonial {
  @apply bg-muted p-6 rounded-lg my-6;
}
```

## Performance

The styles are compiled with Tailwind and don't add significant overhead. The WordPress content rendering happens server-side, so there's no client-side processing delay.
