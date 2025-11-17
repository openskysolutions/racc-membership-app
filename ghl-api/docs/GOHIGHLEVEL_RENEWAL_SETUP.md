# GoHighLevel Renewal Date Setup Guide

## Quick Setup Checklist

- [ ] Create `contact.renewal_date` custom field in GoHighLevel
- [ ] Populate existing contacts with renewal dates
- [ ] Add 'active' tags to current members
- [ ] Test login with sample contact
- [ ] Set up automation to update renewal dates (optional)

## Step 1: Create Custom Field in GoHighLevel

1. Log into your GoHighLevel account
2. Navigate to **Settings** → **Custom Fields**
3. Click **Add Custom Field** or **Create Field**
4. Configure the field:
   ```
   Field Name: Renewal Date
   Field Key: renewal_date  (or renew_date)
   Field Type: Date
   Object Type: Contact
   Required: No (optional)
   Default Value: (leave empty)
   ```
5. Click **Save**

**Note**: The system will look for this field using multiple possible names:
- Direct property: `renewal_date`, `renewalDate`, or `renew_date`
- Custom field key: `renewal_date`, `renew_date`, or `contact.renewal_date`

## Step 2: Populate Renewal Dates

### Option A: Manual Entry

1. Go to **Contacts**
2. Select a contact
3. Find the **Renewal Date** field in custom fields
4. Enter the date when their membership was last renewed
5. Click **Save**

### Option B: Bulk Import

1. Export your contacts to CSV
2. Add a column: `contact.renewal_date`
3. Format dates as: `YYYY-MM-DD` (e.g., `2024-11-15`)
4. Import the CSV back into GoHighLevel
5. Map the `contact.renewal_date` column to the custom field

### Option C: API Update

Use the GoHighLevel API to update contacts programmatically:

```javascript
// Example API call to update renewal date
const axios = require('axios');

const updateRenewalDate = async (contactId, renewalDate) => {
  // Option 1: Set as direct property (if GoHighLevel supports it)
  await axios.put(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    {
      renewal_date: renewalDate // Format: 2024-11-15
    },
    {
      headers: {
        'Authorization': `Bearer YOUR_API_TOKEN`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      }
    }
  );
  
  // Option 2: Set as custom field (if custom field exists)
  await axios.put(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    {
      customFields: [
        {
          key: 'renewal_date', // or 'renew_date'
          field_value: renewalDate // Format: 2024-11-15
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer YOUR_API_TOKEN`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      }
    }
  );
};

// Usage
await updateRenewalDate('contact_id_here', '2024-11-15');
```

## Step 3: Add Active Tags

For current, active members:

1. Go to **Contacts**
2. Select the contact
3. Click **Add Tag**
4. Type `active` and press Enter
5. Click **Save**

Or use bulk actions:
1. Filter contacts by criteria
2. Select all or specific contacts
3. Click **Bulk Actions** → **Add Tags**
4. Enter `active`
5. Click **Apply**

## Step 4: Test Login

Test with a contact that has:
- ✅ 'active' tag
- ✅ `contact.renewal_date` less than 13 months old
- ✅ Account created in the membership portal

Expected: Login succeeds

Test with a contact that has:
- ✅ 'active' tag
- ❌ `contact.renewal_date` MORE than 13 months old

Expected: Login fails with "Membership expired - renewal date is more than 13 months old"

## Step 5: Set Up Automation (Optional)

### Auto-Update Renewal Date on Payment

Create a workflow in GoHighLevel:

1. **Trigger**: Payment Received
2. **Filter**: Check if it's a membership renewal payment
3. **Action**: Update Contact Custom Field
   - Field: `contact.renewal_date`
   - Value: `{{current_date}}`

### Send Renewal Reminders

Create a workflow to remind members before expiration:

1. **Trigger**: Date-based trigger
2. **Condition**: 
   - `contact.renewal_date` is 11 months old (or your preferred timing)
   - Contact has 'active' tag
3. **Action**: Send Email
   - Subject: "Your RACC Membership Renewal is Coming Up"
   - Body: (include renewal link)

### Auto-Remove Active Tag on Expiration

1. **Trigger**: Daily scheduled trigger
2. **Condition**: 
   - `contact.renewal_date` is more than 13 months old
   - Contact has 'active' tag
3. **Action**: Remove Tag 'active'

## Recommended Date Calculations

### When to Set Renewal Date

Set `contact.renewal_date` to:
- **New member**: Date they first paid/joined
- **Renewed member**: Date of their most recent renewal payment
- **Imported existing member**: Their last known membership payment date

### Validity Window

Current system settings:
- **Valid**: Renewal date is ≤ 13 months ago
- **Expired**: Renewal date is > 13 months ago

Example:
- Today: November 17, 2025
- Cutoff: October 17, 2024 (13 months ago)
- Valid renewal dates: October 17, 2024 or later
- Expired renewal dates: October 16, 2024 or earlier

## Common Scenarios

### Scenario 1: Annual Membership
Member pays on January 1st each year:
- Set `contact.renewal_date` = January 1, 2024
- They'll remain active until February 1, 2025 (13 months)
- This gives a 1-month grace period after the year ends

### Scenario 2: Monthly Membership
Member pays monthly:
- Update `contact.renewal_date` each month when payment is received
- They'll have access as long as payment was received within 13 months

### Scenario 3: Lifetime Membership
For lifetime members:
- Option 1: Set `contact.renewal_date` to current date (and update annually via automation)
- Option 2: Create a separate 'lifetime' tag and modify code to skip date check for those members

## Troubleshooting

### "No renewal date found" error

**Cause**: The custom field exists but has no value for this contact

**Fix**:
1. Open the contact in GoHighLevel
2. Check if `Renewal Date` field is empty
3. Add a date value
4. Save and try logging in again

### "Field not found" in API logs

**Cause**: The custom field key doesn't match exactly

**Fix**:
1. Go to Settings → Custom Fields
2. Click on the Renewal Date field
3. Verify the key is exactly: `contact.renewal_date`
4. If different, either:
   - Update the field key in GoHighLevel, OR
   - Update the code to match your field key

### Contact has active tag and valid date but still can't login

**Check**:
1. Is the contact email exactly the same as login email?
2. Does the contact have a password set in the portal database?
3. Check server logs for specific error messages
4. Verify date format is valid (ISO 8601)

## Data Migration Script

If you need to set renewal dates for existing contacts based on payment history:

```javascript
// Example: Set renewal date based on last payment
const setRenewalDatesFromPayments = async () => {
  // 1. Fetch all contacts
  const contacts = await fetchAllContacts();
  
  // 2. For each contact, find their last payment
  for (const contact of contacts) {
    const lastPayment = await getLastPayment(contact.id);
    
    if (lastPayment) {
      // Set renewal date to last payment date
      await updateRenewalDate(contact.id, lastPayment.date);
    } else {
      // No payment found - set to 14 months ago (will be expired)
      const expiredDate = new Date();
      expiredDate.setMonth(expiredDate.getMonth() - 14);
      await updateRenewalDate(contact.id, expiredDate.toISOString().split('T')[0]);
    }
  }
};
```

## Support

If you encounter issues:
1. Check the server logs in `ghl-api` for detailed error messages
2. Verify the custom field exists and has correct key
3. Test with a known-good contact (fresh setup)
4. Review the RENEWAL_DATE_CHECK.md documentation

For additional help, contact the development team.
