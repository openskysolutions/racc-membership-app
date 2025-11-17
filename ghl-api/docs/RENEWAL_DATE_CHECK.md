# Renewal Date Check Implementation

## Overview

The authentication system now validates that a user's membership is current by checking both:
1. The presence of an 'active' tag in GoHighLevel
2. That the `contact.renewal_date` custom field is less than 13 months old

## How It Works

### Login Flow

When a user attempts to log in via `/auth/authorize` or `/auth/session`:

1. **Credential Verification**: Email and password are verified against the PostgreSQL database
2. **Active Status Check**: The system calls `ghlService.isUserActive(email)` which:
   - Searches for the contact in GoHighLevel by email
   - Checks if the contact has the 'active' tag
   - Extracts the renewal date from `contact.renewal_date` custom field
   - Calculates if the renewal date is within 13 months (393 days)
3. **Access Decision**: Login is granted only if ALL conditions are met:
   - Valid credentials in database
   - Contact has 'active' tag in GoHighLevel
   - Renewal date is less than 13 months old

### Renewal Date Field

The system looks for the renewal date in the following locations (in order):

1. **Direct contact properties** (checked first):
   - `contact.renewal_date`
   - `contact.renewalDate`
   - `contact.renew_date`

2. **customField array** (format: `[{id/key: 'field_name', value: 'field_value'}]`):
   - Field with `id` or `key` = `'renewal_date'`
   - Field with `id` or `key` = `'renew_date'`
   - Field with `id` or `key` = `'contact.renewal_date'`

3. **customFields object** (format: `{field_name: 'field_value'}`):
   - `contact.customFields['renewal_date']`
   - `contact.customFields['renew_date']`
   - `contact.customFields['contact.renewal_date']`

Expected format: ISO 8601 date string (e.g., `"2024-11-15T00:00:00.000Z"`) or any valid date string that JavaScript's `Date()` constructor can parse.

### Error Messages

The system provides specific error messages based on the failure reason:

| Reason | HTTP Status | Error Message |
|--------|-------------|---------------|
| Contact not found | 403 | "Contact not found" |
| Missing active tag | 403 | "Missing active tag" |
| No renewal date | 403 | "No renewal date found" |
| Expired renewal | 403 | "Membership expired - renewal date is more than 13 months old" |

## Configuration

### Time Window

The 13-month window is hardcoded in `gohighlevel.ts`:

```typescript
const thirteenMonthsAgo = new Date();
thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

const isRenewalValid = renewDate >= thirteenMonthsAgo;
```

To adjust this window, modify the `setMonth` parameter in the `isUserActive` method.

### GoHighLevel Custom Field

The renewal date must be stored in GoHighLevel as a custom field with key `contact.renewal_date`.

#### Setting Up in GoHighLevel:

1. Go to Settings → Custom Fields
2. Create a new field:
   - **Name**: Renewal Date
   - **Key**: `contact.renewal_date`
   - **Type**: Date
   - **Object**: Contact
3. Ensure this field is populated for all contacts

## Testing

### Development Mode

In development mode (when `NODE_ENV=development` or missing credentials), the renewal check is bypassed and all users are considered active.

### Test Script

Run the test script to verify the logic:

```bash
cd ghl-api
node tests/test-renewal-date-check.js
```

This will test various scenarios:
- Valid renewal (< 13 months)
- Expired renewal (> 13 months)
- Missing renewal date
- Active tag but expired

### Manual Testing

To test with a real contact:

1. Ensure the contact exists in GoHighLevel
2. Add the 'active' tag
3. Set the `contact.renewal_date` field to a specific date
4. Attempt to login via the frontend or Postman

Example dates for testing:
- **Valid**: `2024-11-15` (current month)
- **Expired**: `2023-09-15` (14+ months ago)

## Frontend Integration

The frontend receives detailed error information:

```typescript
// Login error response
{
  error: 'access_denied',
  error_description: 'Membership expired - renewal date is more than 13 months old',
  userStatus: 'inactive',
  requiresActivation: true,
  reason: 'Membership expired - renewal date is more than 13 months old'
}
```

Display the `error_description` or `reason` to the user, along with contact information for support.

## Logging

The system logs detailed information during the renewal check:

```
🔍 Checking if user email@example.com has 'active' tag and valid renewal date in GoHighLevel...
📅 Found renewal date: 2024-11-15T00:00:00.000Z
📊 Renewal check for email@example.com:
  renewDate: 2024-11-15T00:00:00.000Z
  thirteenMonthsAgo: 2023-10-17T00:00:00.000Z
  now: 2025-11-17T00:00:00.000Z
  isValid: true
  monthsSinceRenewal: 12
✅ User email@example.com is active with valid renewal date
```

Check the server logs for troubleshooting.

## Security Considerations

1. **Database vs GoHighLevel**: The system uses the database for authentication (password) but GoHighLevel as the source of truth for membership status
2. **Status Sync**: The database status is updated to match GoHighLevel during login
3. **Session Expiration**: Sessions expire based on "remember me" setting (1 hour or 30 days)
4. **PKCE Protection**: Login uses OAuth 2.0 with PKCE to prevent token interception

## Troubleshooting

### User can't login despite having active tag

Check:
1. Does the contact have a `contact.renewal_date` field set?
2. Is the date format correct (ISO 8601)?
3. Is the date less than 13 months old?
4. Check server logs for specific error messages

### All users are being denied access

Check:
1. Is the GoHighLevel API token valid?
2. Is the `LOCATION_ID` correct in `.env`?
3. Are you in development mode (check `NODE_ENV`)?

### Renewal date not being found

The system searches for the field in multiple locations. Check server logs for detailed debugging info showing:
- Which locations were checked
- What custom field keys exist on the contact
- Contact properties that contain "renew"

Possible issues:
1. Field key doesn't match any of the expected names (`renewal_date`, `renew_date`, etc.)
2. Field is attached to wrong object type (should be Contact, not Opportunity)
3. Field has no value (empty/null)
4. Field name has typos or extra characters

Check the server logs - they will show you the exact contact structure when the renewal date isn't found.

## Future Enhancements

Possible improvements:
- Make the 13-month window configurable via environment variable
- Add grace period (e.g., allow 14 months instead of 13)
- Support multiple renewal date fields for different membership types
- Add automated renewal reminder emails at 11-12 months
- Dashboard to show users approaching renewal deadline
