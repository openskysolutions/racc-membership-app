# Renewal Date Check - Quick Troubleshooting Guide

## Quick Diagnostic Checklist

When a user reports they cannot login:

### 1. Check Server Logs First 🔍
Look for these log entries:
```
🔍 Checking if user email@example.com has 'active' tag and valid renewal date...
```

The logs will tell you exactly why login failed.

### 2. Common Issues & Solutions

#### ❌ "Contact not found"
**Cause**: Email address doesn't exist in GoHighLevel  
**Fix**: 
- Verify email spelling is correct
- Search for contact in GoHighLevel dashboard
- Create contact if missing

#### ❌ "Missing active tag"
**Cause**: Contact exists but doesn't have 'active' tag  
**Fix**:
- Go to contact in GoHighLevel
- Add 'active' tag
- Save contact

#### ❌ "No renewal date found"
**Cause**: `contact.renewal_date` custom field is empty  
**Fix**:
- Open contact in GoHighLevel
- Find "Renewal Date" custom field
- Set to appropriate date (e.g., last payment date)
- Save contact

#### ❌ "Membership expired - renewal date is more than 13 months old"
**Cause**: Renewal date is older than 13 months  
**Fix**:
- Verify when user last paid
- If they should have access, update renewal date to recent date
- If legitimately expired, contact user about renewal

## Quick Commands

### Check a specific user in database:
```bash
cd ghl-api
node -e "
const { databaseService } = require('./src/services/database');
(async () => {
  await databaseService.initialize();
  const user = await databaseService.getUserByEmail('email@example.com');
  console.log('User:', user);
  process.exit(0);
})();
"
```

### Test GoHighLevel connection:
```bash
cd ghl-api
node test-connection.js
```

### Run renewal date test:
```bash
cd ghl-api
node tests/test-renewal-date-check.js
```

## Error Code Reference

| Status | Error | Meaning | User Action |
|--------|-------|---------|-------------|
| 401 | `invalid_grant` | Wrong password | User should reset password |
| 403 | `access_denied` + "Contact not found" | Not in GHL | Admin: Add to GHL |
| 403 | `access_denied` + "Missing active tag" | Not marked active | Admin: Add 'active' tag |
| 403 | `access_denied` + "No renewal date" | Date not set | Admin: Set renewal date |
| 403 | `access_denied` + "Membership expired" | Date > 13 months | User needs to renew |

## Fast Fixes for Common Scenarios

### Scenario: New member can't login after joining
**Likely Issue**: Missing active tag or renewal date  
**Solution**:
1. Find contact in GoHighLevel
2. Add 'active' tag
3. Set `contact.renewal_date` to today's date
4. Ask user to try again

### Scenario: Long-time member suddenly can't login
**Likely Issue**: Renewal date expired (> 13 months)  
**Solution**:
1. Check when they last paid
2. If payment is current, update renewal date
3. If payment overdue, contact about renewal

### Scenario: All users can't login
**Likely Issue**: GoHighLevel API issue or config  
**Check**:
1. Is API token valid? (Check `.env` file)
2. Is `LOCATION_ID` correct?
3. Are GoHighLevel services online?
4. Check server logs for API errors

### Scenario: Test user works but real users don't
**Likely Issue**: Development mode is on  
**Solution**:
1. Check `NODE_ENV` in `.env`
2. Should be `production` not `development`
3. Ensure API credentials are set

## Field Location Reference

The renewal date can be found in different places depending on how it was set up in GoHighLevel:

```javascript
// Location 1: Direct contact property (most common)
contact.renewal_date
contact.renewalDate
contact.renew_date

// Location 2: customField array
contact.customField.find(f => 
  f.key === 'renewal_date' || 
  f.id === 'renewal_date'
).value

// Location 3: customFields object
contact.customFields['renewal_date']
contact.customFields['renew_date']

// The code checks ALL locations automatically
```

## Date Format Examples

✅ **Valid Formats:**
- `2024-11-15T00:00:00.000Z` (ISO 8601 with time)
- `2024-11-15` (ISO 8601 date only)
- `11/15/2024` (US format, will parse)

❌ **Invalid Formats:**
- `Nov 15, 2024` (text month)
- `15-11-2024` (day-first format may fail)
- Empty or null

## Emergency Bypass (Temporary)

If you need to temporarily allow all users (emergency only):

1. Open `ghl-api/src/services/gohighlevel.ts`
2. Find the `isUserActive` method (around line 256)
3. Add at the top:
```typescript
// TEMPORARY BYPASS - REMOVE AFTER ISSUE RESOLVED
return { isActive: true, contact: { email } };
```
4. Restart server
5. **REMEMBER TO REMOVE THIS AFTER FIXING THE REAL ISSUE**

## Bulk Fix Scripts

### Set all contacts to valid renewal date:
```javascript
// WARNING: This will update ALL contacts
const { ghlService } = require('./src/services/gohighlevel');

async function setAllRenewalDates() {
  const today = new Date().toISOString().split('T')[0];
  const contacts = await ghlService.getAllContacts();
  
  for (const contact of contacts) {
    if (contact.tags?.includes('active')) {
      await ghlService.updateContact(contact.id, {
        customFields: {
          'contact.renewal_date': today
        }
      });
      console.log(`Updated ${contact.email}`);
    }
  }
}

setAllRenewalDates();
```

### Find contacts with expired dates:
```javascript
const { ghlService } = require('./src/services/gohighlevel');

async function findExpiredContacts() {
  const contacts = await ghlService.getAllContacts();
  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
  
  for (const contact of contacts) {
    const renewDate = contact.customFields?.['contact.renewal_date'];
    if (renewDate && new Date(renewDate) < thirteenMonthsAgo) {
      console.log(`EXPIRED: ${contact.email} - ${renewDate}`);
    }
  }
}

findExpiredContacts();
```

## Prevention Checklist

To avoid future issues:

- [ ] Set up automation to update renewal date on payment
- [ ] Create workflow to send renewal reminders at 11 months
- [ ] Document renewal date field for staff
- [ ] Test new member onboarding flow regularly
- [ ] Monitor server logs for failed login attempts
- [ ] Create dashboard showing upcoming expirations

## Support Escalation

If you've tried everything:

1. **Gather Information:**
   - User email
   - Server logs (last 100 lines)
   - GoHighLevel contact record screenshot
   - Database user record (if accessible)

2. **Check Status Pages:**
   - GoHighLevel API status
   - Database connection status
   - Server uptime

3. **Contact Development Team:**
   - Provide all gathered information
   - Describe steps already taken
   - Include exact error messages

## Testing After Fix

After making changes:

1. ✅ Test with known-good user
2. ✅ Test with the reported problem user
3. ✅ Check server logs for errors
4. ✅ Verify no other users affected
5. ✅ Document what was fixed

## Useful Log Grep Patterns

```bash
# Find all failed login attempts today
grep "access_denied" ghl-api/logs/*.log | grep $(date +%Y-%m-%d)

# Find renewal date errors
grep "renewal date" ghl-api/logs/*.log

# Find all logins for specific user
grep "user@example.com" ghl-api/logs/*.log
```

## Quick Reference: 13 Month Calculation

```
Today: Nov 17, 2025
13 months ago: Oct 17, 2024

Valid: Oct 17, 2024 or LATER
Expired: Oct 16, 2024 or EARLIER

Grace Period: 1 month after annual membership expires
```

## Contact Points

- **GoHighLevel Dashboard**: https://app.gohighlevel.com
- **Server Logs**: `ghl-api/logs/`
- **Database Console**: (connection string in `.env`)
- **API Documentation**: `ghl-api/docs/`
