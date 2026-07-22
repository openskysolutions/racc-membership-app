# Implementation Task List: Company-Based Membership Model

**Spec**: `specs/003-company-based-membership/spec.md`  
**Branch**: `003-company-based-membership`  
**Context**: Read `spec.md` in full before starting. Each task references the spec section that describes the behaviour in detail.

Phases must be executed in order. Tasks within a phase are independent unless marked **[depends on X.Y]**.

---

## Phase 1 — Database Schema

### 1.1 Update Prisma schema (`ghl-api/prisma/schema.prisma`)

- [ ] Add `ghlBusinessId String?` field to the `User` model (after `ghlContactId`)
- [ ] Create the new `BusinessProfile` model (full schema in spec → *Data Model Changes → New `BusinessProfile` Table*)
- [ ] In the `MemberCategory` model: rename `ghlContactId` → `ghlBusinessId`, update the `@@unique` and `@@index` constraints to match

### 1.2 Run migration

```bash
cd ghl-api
npx prisma migrate dev --name add-business-profile
npx prisma generate
```

---

## Phase 2 — GHL Service Layer

**File**: `ghl-api/src/services/gohighlevel.ts`

All new methods belong to the existing `GoHighLevelService` class. See spec → *Backend Changes → 1. New GHL Service Methods* for full signatures and comments.

> **API version split**: The existing `this.client` uses `Version: 2021-07-28` (v2) — used for all contact operations. Businesses API calls require `Version: v3`. Create a private `this.clientV3` axios instance in the constructor following the same pattern as `clientV3` in `ghl-api/scripts/bootstrap-ghl-businesses.js`.

### 2.1 Add `getBusinesses(limit, skip)`
- GET `/businesses/?locationId={locationId}&limit={limit}&skip={skip}` via `this.clientV3`
- Returns `GHLBusiness[]`

### 2.2 Add `getBusinessById(businessId)`
- GET `/businesses/{businessId}` via `this.clientV3`
- Returns `GHLBusiness`

### 2.3 Add `createBusiness(data: GHLBusinessCreate)`
- POST `/businesses/` with `{ ...data, locationId: this.locationId }` via `this.clientV3`
- Returns `GHLBusiness`
- Response shape: `response.data?.business ?? response.data` (see bootstrap script line ~211)

### 2.4 Add `updateBusiness(businessId, data)`
- PUT `/businesses/{businessId}` via `this.clientV3`
- Returns `GHLBusiness`

### 2.5 Add `getContactsByBusinessId(businessId)`
- GET `/contacts/business/{businessId}?locationId={locationId}` — this endpoint uses v3 even though contacts are normally v2; pass `Version: v3` explicitly
- Returns `GHLContact[]`

### 2.6 Add `linkContactToBusiness(contactId, businessId)`
- PUT `/contacts/{contactId}` with body `{ businessId }` via the existing `this.client` (v2, `Version: 2021-07-28`)
- Mirrors `linkContactToBusiness()` in `bootstrap-ghl-businesses.js` (line ~220)
- Does **not** throw on failure — callers handle association failure gracefully

---

## Phase 3 — Auth Enrichment

**File**: `ghl-api/src/routes/auth.ts`

See spec → *Backend Changes → 4. Auth — Login / Profile Enrichment* for the full resolution sequence.

### 3.1 Update the login / `getProfile` handler

After resolving the GHL Contact from `ghlContactId`:
- [ ] Extract `contact.businessId` from the GHL Contact response
- [ ] If `User.ghlBusinessId !== contact.businessId`, update `User.ghlBusinessId` in Postgres
- [ ] Call `getBusinessById(contact.businessId)` to get `businessName` (cache for the session)
- [ ] Derive `isMainContact = contact.tags.includes('main-contact')`
- [ ] Derive `isBusinessProfileEditor = contact.tags.includes('business-profile-editor') || isMainContact`

### 3.2 Include new fields in JWT payload and `getProfile()` response
Add to the token and profile response object:
```
ghlBusinessId, businessName, isMainContact, isBusinessProfileEditor
```
These are additional claims alongside the existing `role` claim.

---

## Phase 4 — Email Service

### 4.1 Create invite email template

**New file**: `ghl-api/src/templates/emails/inviteEmail.ts`

Follow the same export pattern as `confirmationEmail.ts`.

- Subject: `You've been added to {businessName} — Richfield Area Chamber of Commerce`
- Body: greet by `firstName`, name the business, prominent "Connect Your Account" CTA button
- Button URL: `https://richfieldareachamber.com/connect-account?email={encodeURIComponent(email)}`

### 4.2 Add `sendInviteEmail()` to email service

**File**: `ghl-api/src/services/emailService.ts`

```typescript
async sendInviteEmail(to: string, firstName: string, businessName: string): Promise<boolean>
```

- On send failure: log the error and return `false`. **Do not throw** — callers must not roll back GHL records if email fails.
- Follow same pattern as `sendConfirmationCode()`.

---

## Phase 5 — New Backend Route File (Businesses)

### 5.1 Create route file

**New file**: `ghl-api/src/routes/businesses.ts`

Export a single Express router. All endpoint handler logic can live in a new controller file `ghl-api/src/controllers/businessesController.ts`, or inline on the router for simpler endpoints.

### 5.2 Register in index router

**File**: `ghl-api/src/routes/index.ts`

```typescript
import businessesRoutes from '@/routes/businesses';
// ...
router.use('/businesses', businessesRoutes);
```

### 5.3 Implement public endpoints

All public routes (no auth required for GET) are mounted at `/businesses`.

---

#### `GET /businesses`

See spec → *Backend Changes → 6. New Backend Endpoints → Member business profile → GET /businesses*

- [ ] Accept query params: `?search=` (business name), `?tier=`, `?city=`, `?categoryId=`
- [ ] Fetch all GHL Businesses via `getBusinesses()` (paginate internally if > 100)
- [ ] For each business, join with `BusinessProfile` row from Postgres (by `ghlBusinessId`)
- [ ] Join with `MemberCategory` rows (now keyed by `ghlBusinessId`) for `categories`
- [ ] Filter to businesses with a non-null `BusinessProfile.membershipTier` (active members only)
- [ ] Apply search/filter in memory or via Prisma `where` clause
- [ ] Return `BusinessMember[]`

---

#### `GET /businesses/:id`

- [ ] Fetch single GHL Business via `getBusinessById(id)`
- [ ] Join with `BusinessProfile` + categories
- [ ] Return `BusinessMember`

---

#### `PATCH /businesses/:id`

Requires auth. Permission check: `(req.user.isBusinessProfileEditor && req.user.ghlBusinessId === req.params.id) || req.user.role === 'admin'`

- [ ] Split the request body:
  - GHL Business fields (`name`, `email`, `phone`, `website`, `address`, `city`, `state`, `postalCode`) → call `updateBusiness(id, ghlFields)`
  - Extended fields (`tagline`, `avatar`, `coverImage`, `bio`, `couponCodes`, `specialties`, `organizationType`, `facebookUrl`, `instagramUrl`, `twitterUrl`, `linkedinUrl`, `hideMembershipTier`) → upsert `BusinessProfile` row in Postgres
  - `bio` also syncs to GHL Business `description` field
- [ ] Return updated `BusinessMember`

---

#### `GET /businesses/:id/team`

Requires auth: `isBusinessProfileEditor && ghlBusinessId === req.params.id` OR `role === 'admin'`

- [ ] Call `getContactsByBusinessId(id)`
- [ ] Return array with fields: `id`, `firstName`, `lastName`, `email`, `phone`, `title`, `tags`

---

#### `POST /businesses/:id/team`

Requires auth: `isBusinessProfileEditor && ghlBusinessId === req.params.id` OR `role === 'admin'`

Body: `{ firstName, lastName, email, phone?, title?, grantEditorAccess? }`

Steps (see spec → *6. New Backend Endpoints → POST /businesses/:id/team* for full detail):
- [ ] 1. Create GHL Contact via `createContact()`
- [ ] 2. `linkContactToBusiness(contactId, req.params.id)` — if fails, set `associationStatus: 'failed'` in response, continue
- [ ] 3. `updateContactTags(contactId, ['active'], 'add')`
- [ ] 4. `updateContact(contactId, { customFields: [{ id: 'J3yL94KqDhUnjurcIG8G', field_value: new Date().toISOString() }] })` — sets `renewal_date`
- [ ] 5. Read `BusinessProfile.membershipTier` for this business; call `updateContactTags(contactId, ['{tier} membership package'], 'add')` if tier is set
- [ ] 6. If `grantEditorAccess && (isMainContact || role === 'admin')`: `updateContactTags(contactId, ['business-profile-editor'], 'add')`
- [ ] 7. `emailService.sendInviteEmail(email, firstName, businessName)` — failure returns `emailSent: false`, does not abort

---

#### `POST /businesses/:id/team/:contactId/editor`

Requires: `isMainContact || role === 'admin'`

- [ ] `updateContactTags(contactId, ['business-profile-editor'], 'add')`

---

#### `DELETE /businesses/:id/team/:contactId/editor`

Requires: `isMainContact || role === 'admin'`

- [ ] `updateContactTags(contactId, ['business-profile-editor'], 'remove')`

---

### 5.4 Implement admin endpoints

Admin endpoints are mounted under the same `/businesses` router with `/admin` path prefix, OR added to the existing `ghl-api/src/routes/admin.ts`. Recommend: add to `admin.ts` to keep all admin routes together.

All require `requireAdmin` middleware.

---

#### `GET /admin/businesses`

- [ ] Accept: `?search=`, `?tier=`, `?city=`, `?state=`, `?limit=`, `?offset=`
- [ ] Fetch all GHL Businesses + join with `BusinessProfile`
- [ ] For `# contacts` column: fetch contact count per business (can use `getContactsByBusinessId()` and take `.length`, or a separate count)
- [ ] Paginate with limit/offset
- [ ] Return `{ businesses: BusinessMember[], total: number }`

---

#### `PATCH /admin/businesses/:id/tier`

- [ ] Body: `{ tier: 'basic' | 'enhanced' | 'elite' | null, memberSince?: string }`
- [ ] Upsert `BusinessProfile` row: set `membershipTier` (and `memberSince` if provided)

---

#### `GET /admin/contacts`

See spec → *6. New Backend Endpoints → GET /admin/contacts → Implementation note*

- [ ] Accept: `?search=`, `?businessId=`, `?tag=`, `?limit=`, `?offset=`
- [ ] If `?businessId=` provided: use `getContactsByBusinessId(businessId)` directly
- [ ] Otherwise: call GHL contacts search (`POST /contacts/search`) with `?query=` for name/email; filter results server-side to contacts where `contact.businessId` is non-empty
- [ ] If `?tag=` provided: filter results to contacts that include the tag
- [ ] Join against local `User` table by `ghlContactId` to populate `hasAppAccount` boolean
- [ ] Return paginated contact list

---

#### `POST /admin/contacts/:contactId/tags`

- [ ] Body: `{ tag: string, action: 'add' | 'remove' }`
- [ ] Call `updateContactTags(contactId, [tag], action)`

---

#### `POST /admin/memberships`

See spec → *6. New Backend Endpoints → POST /admin/memberships* for full step list and rollback policy.

Body:
```json
{
  "contact": { "firstName", "lastName", "email", "phone?", "title?", "isMainContact?" },
  "business": { "name", "email?", "phone?", "website?", "address?", "city?", "state?", "postalCode?", "membershipTier?", "memberSince?" }
}
```

Steps with rollback policy:
- [ ] 1. Create GHL Contact → on failure: return error (nothing to clean up)
- [ ] 2. `createBusiness(data)` → on failure: `DELETE /contacts/:contactId`, return error
- [ ] 3. `linkContactToBusiness(contactId, businessId)` → on failure: **do NOT delete** either record; set `associationStatus: 'failed'` in response, continue
- [ ] 4. `updateContactTags(contactId, ['active'], 'add')`
- [ ] 5. `updateContact(contactId, { customFields: [{ id: 'J3yL94KqDhUnjurcIG8G', field_value: today }] })`
- [ ] 6. If `membershipTier`: `updateContactTags(contactId, ['{tier} membership package'], 'add')`
- [ ] 7. If `isMainContact`: `updateContactTags(contactId, ['main-contact'], 'add')`
- [ ] 8. If `membershipTier`: upsert `BusinessProfile` with tier + memberSince
- [ ] 9. `emailService.sendInviteEmail(...)` → failure: set `emailSent: false` in response, do not abort

---

## Phase 6 — Frontend Type System

**File**: `src/types/member.ts`

See spec → *Frontend Changes → 1. Type System* for complete interface definitions.

- [ ] Add `GHLBusiness` interface (raw GHL API response type)
- [ ] Add `GHLBusinessCreate` interface (input for `createBusiness()`)
- [ ] Update `BusinessMember` interface — add `specialties`, `organizationType` fields; annotate each field with its source (GHL Business native vs. BusinessProfile table)
- [ ] Add `PersonalProfile` interface (My Profile page fields only: `id`, `firstName`, `lastName`, `email`, `phone`, `title`, `bio`, `linkedinUrl`, `avatar`)
- [ ] Add `AuthenticatedUser` interface (JWT/authStore shape: includes `ghlBusinessId`, `businessName`, `isMainContact`, `isBusinessProfileEditor`)
- [ ] Keep `export type Member = BusinessMember` alias to avoid cascade rename during migration

---

## Phase 7 — Frontend Auth Store

**File**: `src/stores/authStore.ts`

- [ ] Add `ghlBusinessId: string | null` to the user state shape
- [ ] Add `businessName: string | null`
- [ ] Add `isMainContact: boolean` (default `false`)
- [ ] Add `isBusinessProfileEditor: boolean` (default `false`)
- [ ] Populate all four fields from the login and `getProfile` API responses (Phase 3 adds these to the response)

---

## Phase 8 — Frontend Pages

### 8.1 Member Directory (`src/pages/Members.tsx`)

- [ ] Change API call from `GET /api/members` to `GET /api/businesses`
- [ ] Pass filter params: `?search=`, `?tier=`, `?city=`, `?categoryId=` (same UI controls as today)
- [ ] Update the local type from `Member` to `BusinessMember` (or use alias — no visible UI change)
- [ ] The member card component should not need changes if field names are preserved

### 8.2 Business Profile Page

**Rename**: `src/pages/MemberDetails.tsx` → `src/pages/BusinessProfile.tsx`  
Update the router import/path accordingly.

- [ ] Route param `:id` is now a `ghlBusinessId` (not a GHL Contact ID)
- [ ] Change API call from `GET /api/members/:id` to `GET /api/businesses/:id`
- [ ] Change update call from `PUT /api/members/:id` to `PATCH /api/businesses/:id`
- [ ] **Edit button** — show when `authStore.isBusinessProfileEditor && authStore.ghlBusinessId === business.id`
- [ ] **Edit form fields** — update to match spec → *Frontend Changes → 4. Member Business Profile Page*:
  - GHL Business native fields: `businessName` (→ `business.name`), `email`, `phone`, `website`, `address1`, `city`, `state`, `postalCode`
  - BusinessProfile fields: `tagline`, `avatar`, `coverImage`, `bio`, `facebookUrl`, `instagramUrl`, `twitterUrl`, `linkedinUrl`, `couponCodes`, `organizationType`, `hideMembershipTier`
  - `membershipTier` / `memberSince` — admin-only, render conditionally on `role === 'admin'`
- [ ] **Team management section** — visible when `isBusinessProfileEditor && ghlBusinessId === business.id`:
  - [ ] Fetch team from `GET /api/businesses/:id/team`
  - [ ] Show each member's name, title, editor badge
  - [ ] "Add Team Member" form → `POST /api/businesses/:id/team`; `grantEditorAccess` toggle only rendered when `isMainContact || role === 'admin'`
  - [ ] Editor toggle per row — only rendered when `isMainContact || role === 'admin'`; calls `POST/DELETE /api/businesses/:id/team/:contactId/editor`
  - [ ] A contact with the `main-contact` tag cannot be toggled off editor access via this UI

### 8.3 Personal Profile Page (`src/pages/Profile.tsx`)

- [ ] **Remove** all business fields: bio, tagline, avatar, coverImage, website, address, social links (Facebook, Instagram, Twitter), membership tier, coupon codes, categories
- [ ] **Keep** only personal fields: `firstName`, `lastName`, `email` (display only, not editable), `phone`, `title`, personal `bio`, personal `linkedinUrl`, personal `avatar` (headshot)
- [ ] API call remains `PUT /api/members/:id` (contact update) for now — this endpoint already handles the personal fields via `updateContact()`; in Phase 4 this will move to a dedicated contact endpoint
- [ ] Add **"My Business" card** at the bottom of the page:
  - Links to `/members/{ghlBusinessId}` (the Business Profile page)
  - Shows `businessName`
  - "Edit Member Business Profile" link visible when `isBusinessProfileEditor`

### 8.4 Admin Page (`src/pages/Admin.tsx`)

See spec → *Frontend Changes → 7. Admin Page* for state, data sources, column specs, and action menu details.

- [ ] Replace the content of the `users` tab with a nested 3-tab component (button group or shadcn `Tabs`)

**Sub-tab: Business Memberships**
- [ ] State: `ghlBusinesses`, `businessLoading`, `businessSearch`, `businessTierFilter`, `businessCityFilter`
- [ ] Fetch from `GET /api/admin/businesses?search=&tier=&city=`
- [ ] Columns: Business name, Tier badge, City, Member since, # contacts, Actions
- [ ] Actions per row: Set tier (→ `PATCH /api/admin/businesses/:id/tier`), View profile, Open in GHL

**Sub-tab: Contacts**
- [ ] State: `ghlContacts`, `contactsLoading`, `contactSearch`, `contactBusinessFilter`, `contactTagFilter`
- [ ] Fetch from `GET /api/admin/contacts?search=&businessId=&tag=`
- [ ] Columns: Name, Email, Phone, Linked Business, Role tags (main-contact / editor badges), Has App Account
- [ ] Actions per row: Toggle `main-contact` tag (→ `POST /api/admin/contacts/:contactId/tags`), Toggle `business-profile-editor` tag, Open in GHL

**Sub-tab: App Users**
- [ ] Same data/behaviour as current users tab (no changes to the API call)
- [ ] Add two new indicator columns: **GHL Contact linked** (`user.ghlContactId != null`), **GHL Business linked** (`user.ghlBusinessId != null`)

**Add New Membership dialog**
- [ ] "Add New Membership" button at top of the admin section, visible to `role === 'admin'` only
- [ ] Dialog with two sections: Contact fields and Business fields (see spec for full field list)
- [ ] On submit → `POST /api/admin/memberships`
- [ ] On success: refresh all three sub-tabs + success toast
- [ ] On failure: error toast, leave form open
- [ ] Validation: firstName, lastName, email (valid format, not already in GHL), businessName required

---

## Phase 9 — Data Migration Scripts

These run **after** Phase 2 is deployed and the Prisma migration (Phase 1) has run.

### 9.1 Run the bootstrap script (create GHL Businesses from contacts)

Already written at `ghl-api/scripts/bootstrap-ghl-businesses.js`. If not yet executed in production:

```bash
cd ghl-api
# Dry run first — prints what it would do without making changes
node scripts/bootstrap-ghl-businesses.js

# Execute
node scripts/bootstrap-ghl-businesses.js --execute
```

### 9.2 Write data migration script: lift contact data into BusinessProfile

**New file**: `ghl-api/scripts/migrate-contact-data-to-businesses.js`

This is a one-time script. For each `User` row with a `ghlContactId`:
1. Call `GET /contacts/:contactId` (v2) to get the contact's `businessId` and custom fields
2. Set `User.ghlBusinessId` from `contact.businessId`
3. For each unique `ghlBusinessId` encountered (process `main-contact`-tagged contacts first for deduplication):
   - Upsert a `BusinessProfile` row using the custom field mappings in spec → *Migration Path → Phase 1 → Step 5 → migration table*
   - Use `INSERT ... ON CONFLICT (ghlBusinessId) DO NOTHING` (first contact = main-contact wins)
4. Migrate `MemberCategory` rows: for each row, look up the contact's `User.ghlBusinessId`, replace `ghlContactId` with `ghlBusinessId`; if two contacts from the same business had overlapping categories, merge (union)

```bash
cd ghl-api
node scripts/migrate-contact-data-to-businesses.js --dry-run
node scripts/migrate-contact-data-to-businesses.js --execute
```

---

## Phase 10 — Cleanup (after production verification)

These steps happen **after** all Phase 8 frontend changes are live and verified in production.

- [ ] Remove old contact-based member list from `GET /api/members` (or update it to proxy `GET /api/businesses`)
- [ ] Remove `PUT /api/members/:id` — the business profile update is now `PATCH /api/businesses/:id`; personal contact update will need its own endpoint
- [ ] Update the registration flow (`ghl-api/src/routes/registration.ts`): remove any logic that sets `businessId` at registration — the chamber admin handles this in GHL post-registration
- [ ] Remove `businessName` / `companyName` text fields from the `User` table where they duplicate `BusinessProfile.name`
- [ ] **GHL Contact custom field cleanup** (low priority, optional): chamber admin can remove the stale contact custom fields listed in spec → *Migration Path → Phase 4 → GHL Contact custom field cleanup*

---

## Key File Reference

| File | Change |
|---|---|
| `ghl-api/prisma/schema.prisma` | Add `ghlBusinessId` to User; add `BusinessProfile` model; update `MemberCategory` |
| `ghl-api/src/services/gohighlevel.ts` | Add 6 new methods (Phase 2) |
| `ghl-api/src/routes/auth.ts` | Update login enrichment (Phase 3) |
| `ghl-api/src/templates/emails/inviteEmail.ts` | New file (Phase 4) |
| `ghl-api/src/services/emailService.ts` | Add `sendInviteEmail()` (Phase 4) |
| `ghl-api/src/routes/businesses.ts` | New file — all `/businesses` routes (Phase 5) |
| `ghl-api/src/routes/index.ts` | Register businesses route (Phase 5.2) |
| `ghl-api/src/routes/admin.ts` | Add admin businesses/contacts endpoints (Phase 5.4) |
| `src/types/member.ts` | Add GHLBusiness, PersonalProfile, AuthenticatedUser types (Phase 6) |
| `src/stores/authStore.ts` | Add 4 new fields (Phase 7) |
| `src/pages/Members.tsx` | Switch to `/api/businesses` endpoint (Phase 8.1) |
| `src/pages/MemberDetails.tsx` → `BusinessProfile.tsx` | Full rewrite for business-centric model (Phase 8.2) |
| `src/pages/Profile.tsx` | Strip business fields, add "My Business" card (Phase 8.3) |
| `src/pages/Admin.tsx` | Replace users tab with 3-sub-tab component (Phase 8.4) |
| `ghl-api/scripts/migrate-contact-data-to-businesses.js` | New migration script (Phase 9.2) |
