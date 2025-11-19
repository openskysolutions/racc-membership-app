# GoHighLevel Iframe - Deployment Steps

## Summary
The WordPress pages contain GoHighLevel forms embedded as iframes. These are **cross-origin** (different domain), so JavaScript cannot access their height directly. We've implemented special handling for GoHighLevel iframes with generous fallback heights.

## What Changed

### React Hook (`src/hooks/useIframeAutoResize.ts`)
- ✅ Enhanced message handler to detect GoHighLevel-specific formats
- ✅ Fallback height of **1800px** for GHL iframes (vs 1200px for generic)
- ✅ Console logging with `[Iframe Resize]` prefix

### Documentation
- ✅ Updated `docs/WORDPRESS_IFRAME_RESIZE.md` with GoHighLevel troubleshooting

## Next Steps

### 1. Test the Event Pages
1. Visit an event page in your React app that contains a GoHighLevel form
2. Open browser console (F12 → Console tab)
3. Look for these messages:

```
[Iframe Resize] Hook started
[Iframe Resize] Container found: [element]
[Iframe Resize] Found iframes: 1
[Iframe Resize] Handling iframe: https://...gohighlevel...
[Iframe Resize] Using fallback height (1800px) - GoHighLevel iframe - src: [url]
```

### 2. Verify Display
- ✅ Form should display without vertical scrollbars
- ✅ All form fields should be visible
- ✅ No content should be cut off at bottom

### 3. Adjust Heights if Needed

**If form is cut off (1500px/1800px not enough):**

**Option A: Quick CSS Fix**
Add to `src/App.css` in `.wp-content` section:
```css
.wp-content iframe {
  min-height: 2500px !important; /* Adjust as needed */
}
```

**Option B: Permanent Code Fix**

In `src/hooks/useIframeAutoResize.ts` (around line 125):
```typescript
const fallbackHeight = isGHL ? '2200px' : '1200px'; // Change from 1800px
```

## Expected Behavior

### What WILL Work ✅
- GHL forms detected and given generous height
- Scrollbars removed from iframes
- Forms fully visible (if height is sufficient)
- Console logging for debugging

### What WON'T Work (By Design) ⚠️
- Dynamic height adjustment based on form content
- Exact-fit iframe heights (cross-origin security prevents this)
- PostMessage communication from GHL forms (they don't send it)

This is **expected** - cross-origin iframes from third-party services like GoHighLevel cannot communicate their height to your app. The fallback heights are the industry-standard solution.

## Troubleshooting

### No console messages
- Check that the React app is running and the page is rendered
- Verify you're looking at the event page (not the WordPress page directly)
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)

### Iframe still has scrollbars
- Check if iframe is actually from GoHighLevel (check src URL)
- Verify `scrolling="no"` attribute in rendered HTML (inspect element)
- Height might not be enough - increase in code

### Form appears too small
- Check console for error messages
- Verify iframe src is correct and form is loading
- Check if WordPress page has the event flag (`is_event=1`)

## Files Modified

```
src/hooks/useIframeAutoResize.ts     (React app - iframe handling)
docs/WORDPRESS_IFRAME_RESIZE.md      (Documentation)
docs/GOHIGHLEVEL_IFRAME_DEPLOYMENT.md (This file)
```

**No WordPress changes needed!** All iframe handling is done in the React app.

## Debugging Steps

If issues persist:
1. Check React console logs for `[Iframe Resize]` messages
2. Inspect the iframe HTML (right-click → Inspect Element)
3. Verify the iframe src URL contains `gohighlevel`, `msgsndr.com`, or `survey`
4. Check that the WordPress content is being fetched (look for `rendered_content` in API response)
5. Ensure `useIframeAutoResize` hook is being called in `BlogPost.tsx`
