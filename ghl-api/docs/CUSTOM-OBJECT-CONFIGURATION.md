# GoHighLevel Custom Object Configuration

## Summary of Configuration (Verified: 2025-10-31)

### Custom Object Details
- **Object ID**: `68f7fab7f044392c0343afd3`
- **Object Key**: `custom_objects.appointment_custom_fields`
- **Display Name**: "Event Custom Fields" (changed from "Appointment Custom Fields")
- **Location ID**: `5FAB1z0AhuVlEdqOzjVX`

### Critical Discovery: Field Key Naming

**IMPORTANT**: GoHighLevel stores custom object properties with **lowercase keys**, even though the field display names in the UI are camelCase.

#### Field Configuration

| Display Name (UI) | Field Key (Storage) | Field ID | Data Type |
|------------------|---------------------|----------|-----------|
| appointmentId | `appointmentid` | TpH8LeZAwqMh5aQzDU6B | TEXT |
| pageUrl | `pageurl` | LkpFUob6A3OR6s3NdV3D | TEXT |
| coverImageUrl | `coverimageurl` | 0z9BQHY2XZYhjwRP1X3v | TEXT |
| downloadFileUrl | `downloadfileurl` | hQ92kXL0MYVb9JkjB2u0 | TEXT |
| internalNote | `internalnote` | bqakbc1X8s7lRQBfxT8H | TEXT |
| id | `id` | 9mDIOx3uWp36QqyfBdZz | TEXT |

### Code Implementation

#### Writing Data (Create/Update)
```typescript
const recordData = {
  properties: {
    appointmentid: baseAppointmentId,     // lowercase!
    pageurl: customFields.pageUrl || '',  // lowercase!
    coverimageurl: customFields.coverImageUrl || '',
    downloadfileurl: customFields.downloadFileUrl || '',
    internalnote: customFields.internalNote || '',
    id: uniqueId  // when creating new record
  }
};
```

#### Reading Data (Search/Fetch)
```typescript
const record = records.find((r: any) => {
  const props = r.properties || {};
  return props.appointmentid === baseAppointmentId;  // lowercase!
});

// Return camelCase to frontend for consistency
return {
  pageUrl: props.pageurl || '',           // read lowercase, return camelCase
  coverImageUrl: props.coverimageurl || '',
  downloadFileUrl: props.downloadfileurl || '',
  internalNote: props.internalnote || '',
  recordId: record.id
};
```

### Recurring Event Handling

#### Composite ID Format
Recurring event instances use composite IDs: `baseId_timestamp_duration`
- Example: `5hyv0TM2O3QYiF1OLHCf_1765393200000_3600`
- Base ID: `5hyv0TM2O3QYiF1OLHCf`
- Timestamp: `1765393200000` (milliseconds)
- Duration: `3600` (seconds)

#### Base ID Extraction
```typescript
const baseAppointmentId = appointmentId.includes('_') && /\d{13}_\d+$/.test(appointmentId)
  ? appointmentId.split('_')[0]
  : appointmentId;
```

**Important**: All recurring instances share ONE custom object record using the base ID.

### Association Schema

- **Association Key**: `appointment_custom_fields_to_appointment`
- **Status**: May not be required (404 on fetch is OK)
- **Reason**: Custom objects are found via property search, not associations
- **Note**: Associations don't work with base IDs for recurring events - they are skipped

### API Endpoints Used

#### Custom Object Records
- **Create**: `POST /objects/{objectId}/records`
- **Update**: `PUT /objects/{objectId}/records/{recordId}`
- **Search**: `POST /objects/{objectId}/records/search`

#### Request Format (Create)
```json
{
  "locationId": "5FAB1z0AhuVlEdqOzjVX",
  "properties": {
    "appointmentid": "baseId",
    "pageurl": "https://...",
    "coverimageurl": "https://...",
    "downloadfileurl": "https://...",
    "internalnote": "Note text",
    "id": "uniqueId"
  }
}
```

#### Request Format (Update)
```json
{
  "properties": {
    "appointmentid": "baseId",
    "pageurl": "https://...",
    "coverimageurl": "https://...",
    "downloadfileurl": "https://...",
    "internalnote": "Note text"
  }
}
```

#### Search Format
```json
{
  "locationId": "5FAB1z0AhuVlEdqOzjVX",
  "page": 1,
  "pageLimit": 100
}
```

### Architecture Decisions

1. **Skip Appointment API for Recurring Series Updates**
   - Prevents duplicate event creation
   - Only update custom objects directly
   - Use dedicated endpoint: `POST /appointments/:id/custom-fields`

2. **Auto-Search for Existing Records**
   - Before creating new custom object, search for existing one
   - Prevents duplicate custom object records
   - All recurring instances share same record

3. **Smart Base ID Extraction**
   - Use regex pattern `/\d{13}_\d+$/` to identify composite IDs
   - Only extract base ID if pattern matches
   - Preserves full ID for non-recurring events

4. **Skip Associations for Recurring Events**
   - Base IDs don't work in association creation
   - Records found via property search instead
   - Only create associations for non-recurring events

5. **Cache Busting**
   - Query parameters: `?_t=${timestamp}`
   - Cache-Control headers: 'no-store, no-cache, must-revalidate, private'

### Troubleshooting

#### 404 Errors on Custom Object
- ✅ Object ID is correct: `68f7fab7f044392c0343afd3`
- ✅ Field keys must be lowercase in storage
- ✅ Association not found is OK (not required)

#### Empty Custom Fields
- ✅ Check property keys are lowercase when reading
- ✅ Verify appointmentid matches (use base ID for recurring)
- ✅ Check cache busting is working

#### Duplicate Events
- ✅ Skip appointment API for recurring series updates
- ✅ Only update custom objects directly
- ✅ Never use `recurringEventUpdateType` parameter

### Verification Script

Run `node verify-custom-object-config.js` to check:
1. Custom object exists with correct ID
2. All required fields are configured
3. Field keys match expected lowercase format
4. Search functionality works
5. Sample records can be retrieved

### Summary

The configuration is **WORKING CORRECTLY**. The key insight is that GoHighLevel stores custom object properties with **lowercase keys**, regardless of the camelCase display names in the UI. Our code now correctly:

1. ✅ Writes data with lowercase keys (`appointmentid`, `pageurl`, etc.)
2. ✅ Reads data using lowercase keys
3. ✅ Returns data to frontend with camelCase for API consistency
4. ✅ Uses base IDs for recurring event custom objects
5. ✅ Skips appointment API for recurring series updates
6. ✅ Auto-searches for existing records before creating new ones

**Backend Status**: ✅ Running with correct configuration at http://localhost:3000/api
