# Dynamic Forms System

This system allows you to create dynamic pages with embedded GoHighLevel forms that can be linked from anywhere in your app.

## Features

- **Form List API**: Fetches all available forms from GoHighLevel for your location
- **Dynamic Form Pages**: Automatically generated pages for any form
- **Lexical Editor Integration**: Insert form links directly from the post editor
- **Form Selector Dialog**: Choose from available forms with a visual interface

## How to Use

### 1. Creating a Form Link in VS Code

To create a direct link to a form page in your code:

```tsx
import { formsService } from '@/services/formsService';

// Get the form page URL
const formUrl = formsService.getFormPageUrl('your-form-id');

// Use in a link or button
<a href={formUrl}>Apply Now</a>
```

### 2. Using the Lexical Editor

When editing a blog post:

1. Click the **Insert** dropdown in the toolbar
2. Select **Form Link** from the menu
3. Choose a form from the dialog
4. The form name will be inserted as a clickable link

### 3. Direct Navigation

Users can access any form directly via:
```
https://your-domain.com/forms/{formId}
```

## API Endpoints

### Backend (ghl-api)

- `GET /api/forms` - List all forms
  - Query params: `limit`, `skip`
  - Returns: `{ forms: Form[], total: number }`

- `GET /api/forms/:formId` - Get specific form
  - Returns: Form details

- `GET /api/forms/:formId/embed-url` - Get embed URLs
  - Returns: `{ embedUrl, submitUrl, formId }`

### Frontend Service

```typescript
import { formsService } from '@/services/formsService';

// Get all forms
const { forms, total } = await formsService.getForms();

// Get specific form
const form = await formsService.getFormById('form-id');

// Get embed info
const embedInfo = await formsService.getFormEmbedInfo('form-id');

// Get page URL
const pageUrl = formsService.getFormPageUrl('form-id');
```

## File Structure

```
Backend:
├── ghl-api/src/services/formsService.ts    # GHL API integration
├── ghl-api/src/routes/forms.ts             # Express routes

Frontend:
├── src/services/formsService.ts            # Frontend API client
├── src/pages/FormPage.tsx                  # Dynamic form page
├── src/components/FormSelectorDialog.tsx   # Form selection UI
└── src/routes.tsx                          # Route: /forms/:formId
```

## Development Mode

In development mode (without GHL credentials), the system returns mock form data:
- Contact Us Form
- Membership Application
- Event Registration

## Form Page Features

- **Embedded iframe**: Displays the GoHighLevel form
- **Responsive design**: Works on mobile and desktop
- **Back navigation**: Easy return to previous page
- **Error handling**: Graceful fallback for missing forms
- **Success handling**: Listens for form submission events

## Customization

### Styling the Form Page

Edit `/src/pages/FormPage.tsx` to customize:
- Header layout
- Card styling
- iframe dimensions
- Success messages

### Adding More Form Features

You can extend the system to:
- Track form submissions
- Add analytics
- Customize thank-you messages
- Add conditional redirects
- Implement form validation

## Security Notes

- Forms are loaded via iframe with appropriate sandboxing
- Only accepts messages from leadconnectorhq.com domains
- Public access (no authentication required)
- Consider adding rate limiting for form submissions

## Examples

### Example 1: Membership Button
```tsx
<Button onClick={() => navigate('/forms/membership-form-id')}>
  Apply for Membership
</Button>
```

### Example 2: Event Registration Link
```tsx
<Link to="/forms/event-registration-id">
  Register for Event
</Link>
```

### Example 3: In Blog Content
When writing a blog post, simply:
1. Select text or place cursor
2. Click Insert → Form Link
3. Choose "Contact Us Form"
4. The text becomes a link to the form page

## Troubleshooting

### Forms not loading?
- Check that LOCATION_ID is set in ghl-api/.env
- Verify PRIVATE_INTEGRATION_TOKEN is valid
- Check browser console for CORS errors

### Form selector empty?
- Verify backend is running (npm start in ghl-api/)
- Check network tab for API errors
- Confirm forms exist in your GHL account

### Iframe not displaying?
- Check iframe sandbox attributes
- Verify GHL form URLs are correct
- Check for Content Security Policy issues
