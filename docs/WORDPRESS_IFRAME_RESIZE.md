# WordPress Iframe Auto-Resize Setup

Since the iframes are cross-origin (from a different domain than your app), JavaScript cannot directly access their content for security reasons.

## GoHighLevel Forms Special Handling

This implementation includes specific handling for **GoHighLevel** form embeds, which are commonly used in the WordPress pages. GoHighLevel iframes are cross-origin and don't provide height information, so they receive special treatment:

- **Automatically detected** by URL patterns: `gohighlevel`, `msgsndr.com`, `survey`
- Set to a generous height of **1800px** to accommodate long forms (generic iframes get 1200px)
- Scrolling disabled with `scrolling="no"` attribute
- Console logging for debugging: `[Iframe Resize] Detected GoHighLevel iframe`

The React hook (`src/hooks/useIframeAutoResize.ts`) automatically applies this handling when rendering WordPress content. 

## How It Works

The React app automatically handles iframe resizing using a custom hook (`useIframeAutoResize`) that:

1. **Detects all iframes** in the WordPress content using MutationObserver
2. **Identifies GoHighLevel forms** by checking for URL patterns
3. **Sets appropriate heights**: 1800px for GHL forms, 1200px for generic iframes
4. **Disables scrolling** with `scrolling="no"` attribute
5. **Listens for postMessage** events in case the iframe sends height data
6. **Logs to console** for debugging

No WordPress-side changes are needed - everything is handled in the React app!

## Current Limitations

1. **Cross-Origin iframes**: Due to browser security, we cannot access the content of iframes from different domains (like GoHighLevel)
2. **Fallback Heights**: We use generous fallback heights to ensure content is visible:
   - GoHighLevel forms: 1500px (WordPress) / 1800px (React)
   - Generic iframes: 1200px (React fallback)
3. **Dynamic Content**: Some forms/content may load slowly and not trigger resize in time
4. **GoHighLevel Auto-Resize**: GHL forms don't provide postMessage height updates, so we rely on fixed heights

## Troubleshooting

### Check Console Logs

The React hook includes detailed console logging with `[Iframe Resize]` prefix:
- `"Hook started"` - Hook initialized
- `"Found iframes: X"` - Number of iframes detected
- `"Using fallback height (1800px) - GoHighLevel iframe"` - GHL-specific fallback applied
- `"SUCCESS via postMessage"` - Iframe successfully sent height data (rare for GHL)

### Common Issues

**1. Iframe still has scrollbars**
- Check console for `"Using fallback height (1800px) - GoHighLevel iframe"` message
- Verify the iframe src contains GoHighLevel URL patterns
- For very long forms, increase height in `src/hooks/useIframeAutoResize.ts`:
  ```typescript
  const fallbackHeight = isGHL ? '2200px' : '1200px'; // Increase from 1800px
  ```

**2. Height not updating dynamically**
- GoHighLevel forms **won't** update height automatically (cross-origin limitation)
- This is expected behavior - fallback heights are the solution
- If iframe isn't detected as GHL, check URL patterns in code

**3. Form content cut off at bottom**
- Increase GoHighLevel-specific height in `useIframeAutoResize.ts` (see issue #1)
- Check if form loaded additional content after initial render
- Verify `scrolling="no"` attribute is present in rendered HTML (inspect element)

**4. Multiple resize attempts in console**
- This is normal - the system tries multiple times to catch dynamically loaded content
- Check final height in console logs after 2+ seconds

### Quick Height Adjustment (CSS Override)

If you need a quick fix without editing code:

```css
.wp-content iframe {
  min-height: 2500px !important; /* Adjust as needed */
}
```

## Best Solution: iFrame Resizer Library

For a more robust solution that works with cross-origin iframes, we can use the `iframe-resizer` library:

### Install the library:
```bash
npm install iframe-resizer
```

### Add to WordPress (in the iframe code module):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.2/iframeResizer.contentWindow.min.js"></script>
<iframe src="your-form-url" id="myIframe"></iframe>
```

### Update the React hook to use it:
```typescript
import iframeResize from 'iframe-resizer/js/iframeResizer';

// In the hook:
iframe.addEventListener('load', () => {
  iframeResize({ log: false }, iframe);
});
```

This would provide perfect height detection even for cross-origin iframes, but requires adding the script to both the WordPress page and the form source.
