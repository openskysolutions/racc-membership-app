# Nominations System Implementation Guide

This guide walks through implementing the complete nominations and voting system for Business of the Month and Customer Service Superstar awards.

## Overview

The system includes:
- Public nomination forms for businesses and individuals
- Database storage for nominations
- Board member voting interface
- Admin controls for managing nominations
- Search functionality for finding members/businesses to nominate

## Implementation Steps

### 1. Database Migration

Run the Prisma migration to create the new tables:

```bash
cd ghl-api
npx prisma migrate dev --name add_nominations_and_votes
npx prisma generate
```

This creates:
- `nominations` table: stores all nominations
- `votes` table: stores board member votes on nominations
- Updates `users` table with votes relation

### 2. Add Search Method to GoHighLevel Service

Add this method to `/ghl-api/src/services/gohighlevel.ts`:

```typescript
/**
 * Search for contacts in GoHighLevel
 */
async searchContacts(query: string): Promise<any[]> {
  if (this.developmentMode) {
    // Return mock data in development
    return [
      {
        id: 'dev_contact_1',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Doe Enterprises',
        email: 'john@doeenterprises.com',
        phone: '555-0100'
      },
      {
        id: 'dev_contact_2',
        firstName: 'Jane',
        lastName: 'Smith',
        businessName: 'Smith Solutions',
        email: 'jane@smithsolutions.com',
        phone: '555-0101'
      }
    ];
  }

  try {
    const response = await this.client.get(`/contacts/`, {
      params: {
        locationId: this.locationId,
        query: query,
        limit: 20
      }
    });
    
    return response.data.contacts || [];
  } catch (error: any) {
    console.error('Failed to search contacts:', error.message);
    throw error;
  }
}
```

### 3. Replace Old Nominations Route

Replace `/ghl-api/src/routes/nominations.ts` with the new implementation:

```bash
cd ghl-api/src/routes
mv nominations.ts nominations-old.ts.backup
mv nominations-new.ts nominations.ts
```

### 4. Rebuild Backend

```bash
cd ghl-api
npm run build
npm start
```

### 5. Frontend Components

Create the following React components in `/src/components/nominations/`:

#### Required Components:
1. `NominationForm.tsx` - Form for submitting nominations
2. `BusinessSearchCombobox.tsx` - Searchable dropdown for selecting businesses/contacts
3. `NominationsList.tsx` - Display list of nominations (for board members)
4. `VotingCard.tsx` - Individual nomination card with voting controls
5. `NominationsVoting.tsx` - Full voting interface for board members

### 6. Update Nominations Page

The Nominations page needs to be updated to:
- Remove the iframe embeds
- Add the new `NominationForm` components
- Check user role and conditionally show voting interface for board members

## API Endpoints

### Public Endpoints (no auth required):
- `POST /api/nominations` - Submit a nomination
- `GET /api/nominations` - List nominations (with filters)
- `GET /api/nominations/search?query=&type=` - Search for nominees
- `GET /api/nominations/:id` - Get nomination details
- `GET /api/nominations/:id/votes` - Get vote summary

### Protected Endpoints (board/admin only):
- `POST /api/nominations/:id/vote` - Cast a vote (moderator/admin only)
- `PATCH /api/nominations/:id/status` - Update status (admin only)

## Roles & Permissions

- **Public/Members**: Can submit nominations
- **Moderators/Board Members**: Can submit nominations + vote
- **Admins**: Can submit, vote, and change nomination status

## Database Schema

### Nominations Table
```prisma
model Nomination {
  id                  Int      @id @default(autoincrement())
  type                String   // 'business' or 'individual'
  category            String   // 'business_of_month' or 'customer_service_superstar'
  nomineeGhlId        String
  nomineeName         String
  nomineeBusinessName String?
  nominatorName       String
  nominatorEmail      String
  reason              String
  status              String   @default("pending")
  year                Int
  month               Int?
  votes               Vote[]
  createdAt           DateTime @default(now())
}
```

### Votes Table
```prisma
model Vote {
  id           Int        @id @default(autoincrement())
  nominationId Int
  userId       Int
  voteValue    Int        // 1-5 rating
  comment      String?
  nomination   Nomination @relation(...)
  user         User       @relation(...)
  
  @@unique([nominationId, userId])
}
```

## Testing

1. Test public nomination submission
2. Test search functionality
3. Test board member login and voting
4. Test vote calculations and statistics
5. Test admin status updates

## Next Steps

After basic implementation:
1. Add email notifications when nominations are submitted
2. Add winner announcement feature
3. Create public winners gallery
4. Add nomination period controls (open/close submissions)
5. Add export functionality for reports
