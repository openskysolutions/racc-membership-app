# Custom Fields Setup for Calendar Events

## Overview
This document describes the setup and implementation of custom fields for calendar appointments using GoHighLevel Custom Objects.

## Custom Object Details
- **Name**: Appointment Custom Fields
- **ID**: `68f7fab7f044392c0343afd3`
- **Created**: Via GoHighLevel UI (October 21, 2025)
- **Purpose**: Store additional metadata for calendar appointments (page URLs, images, files, notes)
- **Association**: 
  - **Key**: `appointment_custom_fields_to_appointment`
  - **ID**: `68f807af999a8a8493737ea7`
  - **Type**: ONE_TO_ONE (each appointment has exactly one custom fields record)
  - **Created**: Via API (setup-custom-objects.js)

## Setup Status

### ✅ Completed
1. **Custom Object Created** - Created in GoHighLevel UI with ID `68f7fab7f044392c0343afd3`
2. **Association Created** - Created via API with key `appointment_custom_fields_to_appointment` (ID: `68f807af999a8a8493737ea7`)
3. **Backend Implementation**:
   - Updated `ghlService` with custom object ID constant
   - Implemented `upsertAppointmentCustomObject()` method to create/update records
   - Implemented `getAppointmentCustomFields()` method to fetch records
   - Added controller endpoint `GET /calendars/appointments/:id/custom-fields`
3. **Frontend Implementation**:
   - Lazy-loading architecture in `EventFormDialog.tsx`
   - Service method `getEventCustomFields()` in `calendar.ts`
   - Updated TypeScript interfaces for custom fields

### ⏳ Pending - MANUAL STEP REQUIRED

**Add Fields via GoHighLevel UI:**

You must manually add the following fields to the custom object in GoHighLevel:

1. Go to **Settings → Custom Objects → Appointment Custom Fields**
2. Click **Add Field** for each of the following:

| Field Name | Data Type | Required | Description |
|------------|-----------|----------|-------------|
| `appointmentId` | TEXT | ✅ Yes | Links the record to a calendar appointment |
| `pageUrl` | TEXT | No | URL to the event's dedicated page |
| `coverImageUrl` | TEXT | No | URL to the cover image for the event |
| `downloadFileUrl` | TEXT | No | URL to downloadable file/resource |
| `internalNote` | LARGE_TEXT | No | Internal notes about the event |

**Why Manual?**
The GoHighLevel API does not support adding fields to custom objects programmatically. Fields must be added through the UI.

## Implementation Details

### Backend (Node.js/Express)

**File**: `ghl-api/src/services/gohighlevel.ts`

```typescript
// Custom Object ID constant
private readonly APPOINTMENT_CUSTOM_OBJECT_ID = '68f7fab7f044392c0343afd3';

// Create/Update custom fields
await ghlService.upsertAppointmentCustomObject(
  appointmentId,
  {
    pageUrl: 'https://example.com/event',
    coverImageUrl: 'https://example.com/cover.jpg',
    downloadFileUrl: 'https://example.com/download.pdf',
    internalNote: 'Important event notes'
  },
  existingRecordId // optional for updates
);

// Fetch custom fields
const customFields = await ghlService.getAppointmentCustomFields(appointmentId);
```

**API Endpoint**:
```
GET /api/calendars/appointments/:id/custom-fields
```

Returns:
```json
{
  "pageUrl": "https://example.com/event",
  "coverImageUrl": "https://example.com/cover.jpg",
  "downloadFileUrl": "https://example.com/download.pdf",
  "internalNote": "Important notes",
  "recordId": "abc123"
}
```

### Frontend (React/TypeScript)

**File**: `src/components/EventFormDialog.tsx`

- Custom fields are **lazy-loaded** when editing an event
- Only fetched when the dialog opens (not for all calendar events)
- Improves performance by avoiding unnecessary API calls

**File**: `src/services/calendar.ts`

```typescript
// Fetch custom fields for an event
const customFields = await getEventCustomFields(eventId);
```

## How It Works

### Creating an Event
1. User creates a new calendar event via the app
2. If custom fields are provided (pageUrl, coverImageUrl, etc.):
   - Event is created in GoHighLevel
   - Custom object record is created with a one-to-one link to the appointment
   - Association ensures each appointment has exactly one custom fields record

### Editing an Event
1. User clicks on an existing event
2. Event dialog opens and displays basic event data immediately
3. **Background**: Custom fields are fetched asynchronously
4. Form updates when custom fields load
5. On save: Custom object record is updated (or created if it doesn't exist)

### Data Flow
```
Frontend → API → GoHighLevel Custom Objects API
   ↓                           ↓
  Form               Custom Object Record
   ↓                           ↓
Save/Update ← Association ← Appointment
```

## Testing Checklist

After adding the fields via the GoHighLevel UI:

- [ ] Create a new event with all custom fields populated
- [ ] Verify custom object record is created in GoHighLevel
- [ ] Verify association is created between appointment and custom object
- [ ] Edit the event and verify custom fields load correctly
- [ ] Update custom fields and verify changes are saved
- [ ] Create an event without custom fields (verify graceful handling)
- [ ] Check error handling if custom object doesn't exist

## Troubleshooting

### Issue: Custom fields not saving
**Check:**
1. Have you added all 5 fields to the custom object in GoHighLevel UI?
2. Are the field names exactly as specified (case-sensitive)?
3. Check backend logs for API errors

### Issue: Custom fields not loading
**Check:**
1. Check browser console for errors
2. Verify the appointment ID is correct
3. Check that a custom object record exists for the appointment

### Issue: "Custom object not found" error
**Check:**
1. Verify the custom object ID `68f7fab7f044392c0343afd3` exists in GoHighLevel
2. Check that the custom object hasn't been deleted or modified

## API Limitations

Based on testing, the GoHighLevel API has these limitations:

1. **Fields cannot be added via API** - Must use UI
2. **Associations must be created when creating records** - Cannot be created separately via `/associations` endpoint (404 error)
3. **Custom object schema updates are limited** - PUT `/objects/:id` doesn't accept `properties` or `fieldDefinitions`

## Next Steps

1. **Add fields via UI** (see Pending section above)
2. **Test the complete workflow** (see Testing Checklist)
3. **Monitor for errors** in production
4. **Document any issues** encountered during testing

## Files Modified

### Backend
- `ghl-api/src/services/gohighlevel.ts` - Added custom object ID and methods
- `ghl-api/src/controllers/calendarsController.ts` - Added endpoint for fetching custom fields
- `ghl-api/setup-custom-objects.js` - Verification script for custom object

### Frontend
- `src/components/EventFormDialog.tsx` - Lazy-loading implementation
- `src/services/calendar.ts` - API service method
- `src/types/calendar.ts` - TypeScript interfaces (if exists)

## Support

If you encounter issues:
1. Check the GoHighLevel API logs
2. Review backend console logs for detailed error messages
3. Verify all fields are added correctly in the GoHighLevel UI
4. Test with a simple event first before complex data
