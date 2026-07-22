# Spec: Company-Based Membership Model

**Feature Branch**: `003-company-based-membership`  
**Created**: 2026-07-16  
**Status**: Draft  

## Overview

The current app treats **GHL Contacts** as members in the directory. This spec describes the refactor to treat **GHL Businesses** as the "members" of the chamber (the company holds the membership), while **GHL Contacts** become **Users** (people who log into the app).

### Terminology

| Concept | Term (retained) | What it now refers to |
|---|---|---|
| Chamber member | **Member** | A GHL Business — the company that holds the chamber membership |
| App user | **User** | A GHL Contact — a person who logs into the app |
| Public listing of members | **Member directory** | A listing of GHL Businesses (one card per business) |
| Editable page for a business | **Member business profile** | The profile page for a GHL Business |
| Personal account page | **My profile** | The logged-in user's personal Contact data: name, email, phone, title, personal bio, personal LinkedIn, personal avatar |

> **Key shift**: "Member" still means what it always meant to the chamber — a dues-paying organisation. The change is under the hood: a member is now represented by a **GHL Business** record rather than a GHL Contact record. The UI-facing labels ("Member directory", "Member") stay the same.

---

## Core Design Principle: GHL is the Source of Truth

**All business↔contact relationships are managed in GoHighLevel, not in the app.**

The chamber admin (client) manages everything from within GHL:
- Creating and editing Business records
- Associating Contacts to a Business (by assigning a `businessId` to a Contact in GHL)
- Designating **one** Contact per business as the **`main-contact`** by applying that tag in GHL

The **main contact** manages their own team from within the app:
- Granting or revoking the **`business-profile-editor`** tag for other team members of their business
- The app writes these tag changes back to GHL via the existing `updateContactTags` API call
- The main contact implicitly always has member business profile edit access

These are the **primary** operations the app writes back to GHL outside of member business profile field updates. Admins also create GHL Contact and Business records via the admin endpoints (`POST /admin/memberships`, `POST /businesses/:id/team`).

The app **reads** all other relationship data (businessId, tag-based permissions) from GHL at login time and caches it locally.

This means:
- When a user logs into the app, the backend reads their GHL Contact's `businessId` and `tags` to resolve their permissions.
- If the chamber admin changes the `main-contact` tag in GHL, it takes effect on the user's next login.
- If the main contact adds/removes a `business-profile-editor` in the app, that tag change is written to GHL immediately.
- Our local `User` table stores `ghlBusinessId` as a cached value synced from GHL — permissions themselves always derive from live GHL tags at login.

---

## Conceptual Model Change

### Current (Contact-Centric)
```
GHL Contact  ←→  User (DB)  →  "member" in the directory
```
- A person creates an account → their GHL Contact IS the member record
- `businessName` is just a text field on the Contact
- Profile page and member directory card both show the Contact's data

### New (Business-Centric)
```
GHL (chamber admin manages):
  Business  ←—→  Contacts (users)
                      ↓ tag: "main-contact"   ←  set by chamber admin in GHL
                  exactly one per Business

App (main contact manages their team):
  "main-contact" user  →  can grant/revoke "business-profile-editor" tag
                              on other users of their business
                              (written back to GHL via API)

App (reads from GHL):
  Business  →  member directory card + member business profile page
  Contact   →  user login + personal "My Profile" page
  "main-contact" tag     →  can edit member business profile + manage team editors
  "business-profile-editor" tag  →  can edit member business profile
```

**Permission hierarchy:**

| Role | Set by | Can edit member business profile | Can add team members | Grant / revoke editor role |
|---|---|---|---|---|
| Chamber admin | GHL account | ✅ (via GHL) | ✅ (via GHL) | ✅ (via GHL) |
| App admin | App `role = 'admin'` | ✅ (via app) | ✅ (via app) | ✅ (via app) |
| `main-contact` | Chamber admin (GHL tag) | ✅ | ✅ (via app) | ✅ (via app) |
| `business-profile-editor` | Main contact (app) or chamber admin (GHL) | ✅ | ✅ | ❌ |
| Other team member | — | ❌ | ❌ | ❌ |

- **Users** are GHL Contacts — people who log in; each is linked to a Business via `businessId`
- Every logged-in user can always edit their own **My Profile** (personal Contact data)
- The app writes back to GHL only for: member business profile field updates and `business-profile-editor` tag management

---

## GoHighLevel v3 API — What's Now Available

The old v2 Companies API only existed at the agency level and had no list endpoint,
which is why company data was inaccessible when the app was first built.

The **v3 Businesses API** (sub-account/location level) now provides full CRUD:

| Endpoint | Method | Description |
|---|---|---|
| `GET /businesses/` | GET | **List all businesses for a location** (`?locationId=...`) |
| `GET /businesses/:businessId` | GET | Get a single business by ID |
| `POST /businesses/` | POST | Create a business |
| `PUT /businesses/:businessId` | PUT | Update a business |
| `DELETE /businesses/:businessId` | DELETE | Delete a business |
| `GET /contacts/business/:businessId` | GET | List all contacts belonging to a business |

Auth: **Sub-Account Private Integration Token** — same token we already use.  
Required scopes to add: `businesses.readonly`, `businesses.write`  
API version header: `Version: v3`

### Business Object Fields (GHL v3)
```
id, name, phone, email, website,
address, city, state, postalCode, country,
description, locationId, createdAt, updatedAt
```

> **Note**: Business objects in GHL v3 do **not** support custom fields (unlike Contacts).
> Extended fields (avatar, cover image, tagline, social links, membership tier, coupon codes)
> must be stored in our local Postgres DB. See the `BusinessProfile` table below.

### Contact `businessId` Field
When a Contact in GHL is associated with a Business, it carries a `businessId` field.
The endpoint `GET /contacts/business/:businessId` returns all contacts for that business,
which is how we find a user's company and their co-workers.

---

## Data Model Changes

### Prisma Schema — `User` Table Updates
Add one field to the existing `User` model:

```prisma
model User {
  // ... existing fields ...
  ghlContactId  String?   @unique   // existing — links to GHL Contact (personal identity)
  ghlBusinessId String?             // NEW — cached from GHL Contact's businessId field (synced at login)
  // NOTE: isBusinessProfileEditor is NOT stored here — it is derived at login
  // from the GHL Contact's tags (presence of 'business-profile-editor' tag) and
  // included in the JWT/session, just like 'admin' and 'board member' roles are today.
}
```

> **Why no `isBusinessProfileEditor` column**: The existing permission model already derives `role` from GHL tags at login. The `business-profile-editor` tag follows the same pattern — it is read from GHL at login, placed in the session token, and checked server-side on protected endpoints. Multiple contacts on the same business can hold this tag simultaneously, giving all of them edit access.

### New `BusinessProfile` Table
Stores extended business data that GHL's Business object doesn't support as fields.
This mirrors the pattern already used for `MemberCategory`.

```prisma
model BusinessProfile {
  id               Int      @id @default(autoincrement())
  ghlBusinessId    String   @unique   // FK to GHL Business id
  avatar           String?            // logo / profile photo URL
  coverImage       String?            // cover/banner image URL
  tagline          String?
  bio              String?  @db.Text  // extended description beyond GHL's description field
  membershipTier   String?            // 'elite' | 'enhanced' | 'basic' | 'standard'
  memberSince      String?            // ISO date string
  couponCodes      String[] @default([])
  specialties      String[] @default([])  // comma-separated list, migrated from GHL Contact custom field
  organizationType String?            // e.g. 'nonprofit', 'restaurant', migrated from GHL Contact custom field
  facebookUrl      String?
  instagramUrl     String?
  twitterUrl       String?
  linkedinUrl      String?
  hideMembershipTier Boolean @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("business_profiles")
}
```

### Field Storage Mapping

Every field currently in the member business profile form, mapped to its storage location in the new model:

| Current `Member` field | Form-editable? | New storage location | Notes |
|---|---|---|---|
| `businessName` / `companyName` | ✅ | GHL Business `name` | Native field |
| `email` | ✅ | GHL Business `email` | Native field |
| `phone` | ✅ | GHL Business `phone` | Native field |
| `website` | ✅ | GHL Business `website` | Native field |
| `address1` | ✅ | GHL Business `address` | Field renamed `address` in GHL Business API |
| `city` | ✅ | GHL Business `city` | Native field |
| `state` | ✅ | GHL Business `state` | Native field |
| `postalCode` | ✅ | GHL Business `postalCode` | Native field |
| `country` | — | GHL Business `country` | Not in current form; available to add |
| `bio` | ✅ | `BusinessProfile.bio` + GHL Business `description` | `description` is the GHL-side copy; `bio` stores richer text in Postgres |
| `tagline` | ✅ | `BusinessProfile.tagline` | Was GHL Contact custom field |
| `avatar` | ✅ (upload) | `BusinessProfile.avatar` | Was GHL Contact custom field |
| `coverImage` | ✅ (upload) | `BusinessProfile.coverImage` | Was GHL Contact custom field |
| `membershipTier` | admin only | `BusinessProfile.membershipTier` | Was derived from GHL Contact tags |
| `memberSince` | admin only | `BusinessProfile.memberSince` | Was GHL Contact custom field |
| `couponCodes` | ✅ (Elite) | `BusinessProfile.couponCodes` | Was GHL Contact custom field |
| `specialties` | — (read-only) | `BusinessProfile.specialties` | Was GHL Contact custom field; used in search/filter |
| `organizationType` | — | `BusinessProfile.organizationType` | Was GHL Contact custom field |
| `facebookUrl` | ✅ | `BusinessProfile.facebookUrl` | Was GHL Contact custom field |
| `instagramUrl` | ✅ | `BusinessProfile.instagramUrl` | Was GHL Contact custom field |
| `twitterUrl` | ✅ | `BusinessProfile.twitterUrl` | Was GHL Contact custom field |
| `linkedinUrl` | ✅ | `BusinessProfile.linkedinUrl` | Was GHL Contact custom field |
| `hideMembershipTier` | ✅ | `BusinessProfile.hideMembershipTier` | Was in local DB |
| `categories` | ✅ | `MemberCategory` table | Migrates `ghlContactId` → `ghlBusinessId` |
| `firstName`, `lastName` | ✅ | GHL Contact (stays on User) | Personal identity — not a business field |

> **No GHL custom fields needed on the Business object.** GHL v3 Business objects do not support custom fields at all. All extended data goes into the `BusinessProfile` Postgres table. This is the same pattern already used for `MemberCategory`.

The existing `MemberCategory` table uses `ghlContactId` today. It should be migrated to use `ghlBusinessId` so categories are associated with the business, not the contact.

```prisma
// Existing table — rename FK column
model MemberCategory {
  id            Int    @id @default(autoincrement())
  ghlBusinessId String          // RENAMED from ghlContactId
  subcategory   String
  // ...
}
```

---

## Backend Changes (`ghl-api/`)

### 1. New GHL Service Methods (`src/services/gohighlevel.ts`)

Add direct axios calls for the Businesses v3 API (the `@gohighlevel/api-client` npm package does not yet expose businesses). All calls use `Version: v3` header.

```typescript
// List all businesses for this location (replaces contact-based member listing)
// Uses: GET /businesses/?locationId=...&limit=100&skip=0
async getBusinesses(limit = 100, skip = 0): Promise<GHLBusiness[]>

// Get a single business by its GHL ID
// Uses: GET /businesses/:businessId
async getBusinessById(businessId: string): Promise<GHLBusiness>

// Update a business record (called when a main-contact edits the business profile in the app)
// Uses: PUT /businesses/:businessId
async updateBusiness(businessId: string, data: Partial<GHLBusinessUpdate>): Promise<GHLBusiness>

// Get all contacts belonging to a business (used to list team members on the business profile page)
// Uses: GET /contacts/business/:businessId?locationId=...  (Version: v3)
async getContactsByBusinessId(businessId: string): Promise<GHLContact[]>

// Create a new business record in GHL
// Uses: POST /businesses/  (Version: v3 — separate client instance)
async createBusiness(data: GHLBusinessCreate): Promise<GHLBusiness>

// Link a GHL Contact to a GHL Business by setting the contact's businessId field.
// Confirmed approach: PUT /contacts/:contactId with body { businessId } using the v2 client
// (Version: 2021-07-28). This is a direct field on the contact record — not a separate
// association table. Mirrors the linkContactToBusiness() function in bootstrap-ghl-businesses.js.
async linkContactToBusiness(contactId: string, businessId: string): Promise<void>
```

> The `@gohighlevel/api-client` npm package does not yet expose the Businesses API.
> These calls must be made directly via the existing axios `this.client` instance.
> **API version split**: Businesses API uses `Version: v3`; all contact operations use `Version: 2021-07-28` (v2).
> The existing `this.client` already sends `Version: 2021-07-28` by default and is used for contacts.
> Businesses calls require a separate client instance (or explicit version header override).
>
> **Setting custom fields on a contact**: Use the existing `updateContact(contactId, { customFields: [{ id: fieldId, field_value: value }] })` method. The custom field format is `{ id: string, field_value: any }` (NOT `{ key, value }` — the `id`-based format is required). No separate `setContactCustomField()` method is needed.

### 2. Members Controller (`src/controllers/membersController.ts`)

The current controller fetches contacts filtered by group membership tag.
Replace the core data source:

**Before**: `GET /contacts/search` filtered to `active-member` tag → transforms contacts to Members  
**After**: `GET /businesses/` for the location → transforms businesses to Members, merges with local `BusinessProfile` data

The `transformContactToMember()` method becomes `transformBusinessToMember()`:
- `id` ← `business.id`
- `businessName` ← `business.name`
- `email` ← `business.email`
- `phone` ← `business.phone`
- `website` ← `business.website`
- `address1` ← `business.address`
- `city`, `state`, `postalCode`, `country` ← direct mapping
- `bio` ← `business.description` (+ optional override from `BusinessProfile.bio`)
- `avatar` ← `BusinessProfile.avatar`
- `coverImage` ← `BusinessProfile.coverImage`
- `tagline` ← `BusinessProfile.tagline`
- `membershipTier` ← `BusinessProfile.membershipTier`
- `memberSince` ← `BusinessProfile.memberSince`
- `socialLinks` ← `BusinessProfile.*Url`
- `specialties` ← `BusinessProfile.specialties`
- `organizationType` ← `BusinessProfile.organizationType`
- `categories` ← `MemberCategory` (now keyed by `ghlBusinessId`)

Membership status filtering (active vs. inactive): GHL Business objects don't have tags.
Active membership is determined by whether a `BusinessProfile` record exists with a non-null
`membershipTier`. The chamber admin sets this via the admin panel in the app. This is
fully decoupled from GHL tags and requires no GHL-side changes to show/hide a business from
the member directory.

### 3. Member Business Profile Update Endpoint

**Current**: `PATCH /members/:id` updates a GHL Contact  
**New**: `PATCH /businesses/:id` updates the GHL Business (`PUT /businesses/:businessId`) 
  + upserts the `BusinessProfile` row in Postgres for extended fields.

Permission check: the JWT must contain `isBusinessProfileEditor: true` (derived from GHL `business-profile-editor` tag at login) OR `role = 'admin'`. The `id` in the route is the `ghlBusinessId`.

Both the chamber admin (from GHL) and any tagged user (from the app) can edit the member business profile. There is no conflict — the GHL Business record is the shared source of truth and the last write wins.

### 4. Auth — Login / Profile Enrichment (`src/routes/auth.ts`)

When a user logs in, resolve their identity in this order:

1. Look up the `User` row by email → get `ghlContactId`
2. Call `GET /contacts/:contactId` (v3) → extract:
   - `businessId` — the GHL Business this user belongs to
   - `tags` — check for `main-contact` and `business-profile-editor` tags
3. If `User.ghlBusinessId` doesn't match the contact's `businessId`, update it in the DB
4. Call `GET /businesses/:businessId` to get the business name for the session
5. Derive from tags (same pattern as `role` today):
   - `isMainContact = contact.tags.includes('main-contact')`
   - `isBusinessProfileEditor = contact.tags.includes('business-profile-editor') || isMainContact`  
     *(main contact always has editor access)*
6. Include in the session/JWT and `getProfile()` response:
   - Personal: `firstName`, `lastName`, `email`, `phone`, `avatarUrl`
   - Business: `ghlBusinessId`, `businessName`
   - Permissions: `isMainContact`, `isBusinessProfileEditor`

### 5. Registration (`src/routes/registration.ts`)

Registration flow changes:

**Before**: Create a GHL Contact → link `User.ghlContactId`  
**After**:
1. Create a GHL Contact for the person  
2. The contact's `businessId` association to a GHL Business is **not set by the app during registration** — it is set by the chamber admin in GHL after they have created the Business record and associated the contact.  
3. At first login (after the chamber admin has linked the contact to a business in GHL), the auth enrichment step above automatically resolves and caches `ghlBusinessId` on the `User` row.  
4. Create a `BusinessProfile` row for the business when it is first encountered (i.e., when the first team member from that business logs in and `ghlBusinessId` is resolved).

> **Rationale**: Since the chamber admin controls business setup in GHL, we should not duplicate that workflow in the app's registration form. The app simply creates the personal Contact record; the chamber admin then links it to the right Business in GHL.

### 6. New Backend Endpoints

> **Route file**: All `/businesses` routes (both public and admin-prefixed) live in a new **`src/routes/businesses.ts`** file. The existing `src/routes/members.ts` currently maps GHL Contacts to "members"; it stays in place during Phase 2 dual-mode and is removed in Phase 4 cleanup.

**Member business profile:**
- `GET /businesses` — list all businesses + `BusinessProfile` data (member directory); supports `?search=` (business name), `?tier=` (`basic` | `enhanced` | `elite`), `?city=`, `?categoryId=`
- `GET /businesses/:id` — single business + `BusinessProfile`
- `PATCH /businesses/:id` — update member business profile (requires `isBusinessProfileEditor` or `admin`)

**Team member management:**
- `GET /businesses/:id/team` — list all GHL Contacts for this business (proxies `GET /contacts/business/:id`); requires `isBusinessProfileEditor` or `admin`
- `POST /businesses/:id/team` — create a new GHL Contact, link it to the business, set required login tags, and send an invite email; requires `isBusinessProfileEditor` or `admin`  
  Body: `{ firstName, lastName, email, phone?, title?, grantEditorAccess? }`  
  Steps performed in order:
  1. `POST /contacts` (GHL) — create the contact (firstName, lastName, email, phone, title)
  2. `linkContactToBusiness(contactId, businessId)` — set `businessId` on the contact via `PUT /contacts/:contactId` (v2 API, `Version: 2021-07-28`); if this call fails, log the error and include `{ associationStatus: 'failed' }` in the response, but do NOT delete the created contact — the admin can manually link in GHL
  3. `updateContactTags(contactId, ['active'], 'add')` — required for login
  4. `updateContact(contactId, { customFields: [{ id: 'J3yL94KqDhUnjurcIG8G', field_value: today }] })` — set `renewal_date` to today's ISO date string (required for login)
  5. Read the business's current `BusinessProfile.membershipTier`; apply the matching tag via `updateContactTags(contactId, ['{tier} membership package'], 'add')` so the new contact inherits the business's tier
  6. If `grantEditorAccess` is true AND caller has `isMainContact` or `admin`: `updateContactTags(contactId, ['business-profile-editor'], 'add')`
  7. Send invite email to the new contact (see Invite Email below)
- `POST /businesses/:id/team/:contactId/editor` — grant `business-profile-editor` tag to an existing team member; requires `isMainContact` or `admin`  
  (calls `updateContactTags(contactId, ['business-profile-editor'], 'add')` on GHL)
- `DELETE /businesses/:id/team/:contactId/editor` — revoke `business-profile-editor` tag; requires `isMainContact` or `admin`  
  (calls `updateContactTags(contactId, ['business-profile-editor'], 'remove')` on GHL)

All endpoints are scoped to contacts that belong to the requesting user's own `ghlBusinessId` — a user cannot modify team members on a different business.

### Invite Email

Both `POST /businesses/:id/team` and `POST /admin/memberships` trigger an invite email after the GHL records are created. The email is sent via the existing `emailService.sendEmail()` singleton.

**Subject**: `You've been added to [Business Name] — Richfield Area Chamber of Commerce`

**Body** (HTML): Greets the recipient by first name, names the business they've been added to, and includes a prominent "Connect Your Account" button.

**Link format** (auto-populates and locks the email field on the Connect Account page):
```
https://richfieldareachamber.com/connect-account?email={encodeURIComponent(email)}
```

The Connect Account page (`/connect-account`) already reads the `?email=` query parameter on mount, pre-fills the email input, and disables it so the recipient cannot change it. The recipient then sets a password to complete account setup.

**Failure handling**: A failed email send must **not** roll back the GHL record creation. Log the failure and surface a non-blocking warning in the API response (`{ ..., emailSent: false, emailError: '...' }`) so the admin can re-send manually if needed.

A new `sendInviteEmail(to: string, firstName: string, businessName: string): Promise<boolean>` method should be added to `emailService.ts` alongside the existing `sendConfirmationCode()`. A corresponding HTML template should be added at `src/templates/emails/inviteEmail.ts` following the same pattern as `confirmationEmail.ts`.

**Admin endpoints:**
- `GET /admin/businesses` — all businesses + `BusinessProfile` data (paginated); supports `?search=`, `?tier=`, `?city=`, `?state=`
- `PATCH /admin/businesses/:id/tier` — set membership tier (writes to `BusinessProfile`)
- `GET /admin/contacts` — GHL Contacts that have a `businessId` set (paginated); supports `?search=` (name/email), `?businessId=`, `?tag=` (`main-contact` | `business-profile-editor`)  
  > **Implementation**: GHL's search API has no native "has businessId" filter. Fetch from `GET /contacts/search?locationId=...&query=` for name/email search, then filter server-side to only include contacts where `contact.businessId` is non-empty. When `?businessId=` is provided, use `GET /contacts/business/:businessId` directly instead (avoids the full search). The "Has App Account" indicator is resolved by checking for a matching `User` row in Postgres by `ghlContactId`.
- `POST /admin/contacts/:contactId/tags` — add or remove a tag on a GHL Contact; requires `role = 'admin'`  
  Body: `{ tag: string, action: 'add' | 'remove' }`  
  Any tag may be specified; the admin UI uses this for `main-contact` and `business-profile-editor` toggles on the Contacts sub-tab. Delegates to `updateContactTags(contactId, [tag], action)` on GHL.
- `POST /admin/memberships` — create a full membership record in one atomic operation; requires `role = 'admin'`  
  Body: `{ contact: { firstName, lastName, email, phone?, title?, isMainContact? }, business: { name, email?, phone?, website?, address?, city?, state?, postalCode?, membershipTier?, memberSince? } }`  
  Steps performed in order. **Rollback policy** (GHL has no transactions):
  - Step 1 fails → nothing to clean up
  - Step 2 fails → `DELETE /contacts/:contactId`; abort
  - Step 3 fails (association) → **do NOT delete contact or business** — return `{ associationStatus: 'failed', associationMessage: '...' }`; continue with remaining steps so tags and custom fields are still applied
  - Steps 4–8 fail → log the error and return a partial success; do not delete either GHL record
  - Step 9 (email) fails → non-fatal; return `{ ..., emailSent: false, emailError: '...' }`
  1. `POST /contacts` (GHL) — create the contact
  2. `POST /businesses/` (GHL v3) via `createBusiness()` — create the business
  3. `linkContactToBusiness(contactId, businessId)` — set `businessId` on the contact via `PUT /contacts/:contactId` (v2 API). **If this fails, do NOT delete the contact or the business** — log the error and return `{ ..., associationStatus: 'failed', associationMessage: 'Contact and business created; manual GHL association required' }`. Continue with remaining steps.
  4. `updateContactTags(contactId, ['active'], 'add')` — required for login
  5. `updateContact(contactId, { customFields: [{ id: 'J3yL94KqDhUnjurcIG8G', field_value: today }] })` — set `renewal_date` to today's ISO date string (or `memberSince` if provided) — required for login
  6. If `membershipTier` provided: `updateContactTags(contactId, ['{tier} membership package'], 'add')` — required for directory listing (e.g. `'enhanced membership package'`)
  7. If `isMainContact` is true: `updateContactTags(contactId, ['main-contact'], 'add')`
  8. If `membershipTier` provided: upsert `BusinessProfile` row with tier + memberSince
  9. Send invite email to the new contact (see Invite Email below)

---

## Frontend Changes (`src/`)

### 1. Type System (`src/types/member.ts`)

Rename/restructure:

```typescript
// ── Raw GHL API types (service layer only) ────────────────────────────────────

// What GHL v3 returns for a Business object. Used in gohighlevel.ts before merging with BusinessProfile.
export interface GHLBusiness {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

// Input shape for createBusiness() — POST /businesses/
export interface GHLBusinessCreate {
  name: string;
  locationId: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  description?: string;
}

// ── Application-level types (controllers, frontend) ──────────────────────────

// Represents a chamber member — the GHL Business that holds the membership.
// Fields are merged from two sources: GHL Business (native) and BusinessProfile table (extended).
// This is what the member directory, business profile page, and admin panel work with.
export interface BusinessMember {
  // GHL Business native fields
  id: string;              // GHL Business ID (ghlBusinessId)
  businessName: string;    // business.name
  email?: string;          // business.email
  phone?: string;          // business.phone
  website?: string;        // business.website
  address1?: string;       // business.address
  city?: string;           // business.city
  state?: string;          // business.state
  postalCode?: string;     // business.postalCode
  country?: string;        // business.country
  bio?: string;            // business.description (+ richer copy in BusinessProfile.bio)

  // BusinessProfile table (extended fields not supported by GHL Business natively)
  tagline?: string;
  avatar?: string;         // business logo / profile photo
  coverImage?: string;
  membershipTier?: 'elite' | 'enhanced' | 'basic' | 'standard';
  memberSince?: string;    // ISO date string
  couponCodes?: string[];
  specialties?: string[];
  organizationType?: string;
  facebookUrl?: string;    // business social links (distinct from personal LinkedIn)
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;    // business LinkedIn
  hideMembershipTier?: boolean;

  // Derived / joined
  categories?: string[];   // from MemberCategory table (keyed by ghlBusinessId)
}

// Represents the personal profile form fields for "My Profile" (logged-in user's Contact data).
// This is a deliberate subset — the full GHL Contact type (with all custom fields) exists in the
// codebase already for admin use; this covers only the fields shown and editable on My Profile.
export interface PersonalProfile {
  id: string;              // GHL Contact ID
  firstName?: string;
  lastName?: string;
  email: string;           // login identity — displayed but not editable in the UI
  phone?: string;
  title?: string;          // job title (GHL Contact native field)
  bio?: string;            // personal bio (GHL Contact custom field b3Yfp0NjO23zFXzwjswu)
  linkedinUrl?: string;    // personal LinkedIn (GHL Contact custom field b5LrmKi7eRpvD8r3FPmQ)
  avatar?: string;         // personal headshot (GHL Contact custom field 331dKIcjgTa8z8a6mu37)
}

// Auth session shape (carried in JWT and authStore)
export interface AuthenticatedUser {
  id: string;              // GHL Contact ID
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;            // 'admin' | 'board member' | 'moderator' | 'member'
  status: string;
  ghlBusinessId?: string;
  businessName?: string;
  isMainContact: boolean;
  isBusinessProfileEditor: boolean;
}
```

The existing `Member` interface can be kept as an alias for `BusinessMember` during migration
to avoid a full cascade rename of all component imports.

### 2. Auth Store (`src/stores/authStore.ts`)

The `user` object stored in auth must include:
```typescript
ghlBusinessId: string | null;        // the GHL Business this user belongs to
businessName: string | null;         // cached business name for display
isMainContact: boolean;              // true if GHL Contact has 'main-contact' tag (set by chamber admin)
isBusinessProfileEditor: boolean;    // true if 'business-profile-editor' tag OR isMainContact
```

This mirrors how `role` is already carried in the auth store today.

### 3. Member Directory (`src/pages/Members.tsx`)

No visible change to the user — it still shows a list of member businesses.  
Data source changes from contacts to businesses, but the card layout remains the same.
The `Member` type used in this file becomes `BusinessMember`.

### 4. Member Business Profile Page (`src/pages/MemberDetails.tsx` → rename to `BusinessProfile.tsx`)

- Displays the **business** profile
- The `id` param in the URL is a `ghlBusinessId`
- **Edit mode** available when `user.isBusinessProfileEditor === true` AND `user.ghlBusinessId === business.id`
- **Team management section** visible to `user.isBusinessProfileEditor === true` AND `user.ghlBusinessId === business.id`:
  - Lists all team members (users linked to this business)
  - Shows each member's editor status (whether they have the `business-profile-editor` tag)
  - **"Add Team Member"** button that opens a form: `firstName` (required), `lastName` (required), `email` (required), `phone` (optional), `title` (optional); the `grantEditorAccess` toggle is only rendered when `user.isMainContact === true` or `user.role === 'admin'` — submits to `POST /businesses/:id/team`
  - Toggle button to grant/revoke editor access for existing team members is only rendered when `user.isMainContact === true` or `user.role === 'admin'` (calls `POST/DELETE /businesses/:id/team/:contactId/editor`)
  - The main contact themselves cannot be removed as editor (their access derives from the `main-contact` tag)

### 5. Profile Page (`src/pages/Profile.tsx`) — "My Profile"

This page becomes significantly simpler. All business-related fields (bio, tagline, avatar, cover image, website, address, social links, membership tier, coupon codes, categories) move to the **Member Business Profile**. The personal profile stores only the fields that describe the **person**, not their company.

**Fields retained on "My Profile" (GHL Contact):**
| Field | Notes |
|---|---|
| `firstName` + `lastName` | Personal name |
| `email` | Login identity — displayed but not editable (changing email affects auth) |
| `phone` | Personal / work phone number |
| `title` | Job title within their business (e.g. "Owner", "Marketing Director") |
| `bio` | Short personal bio — distinct from the business description |
| `linkedinUrl` | Personal LinkedIn (as opposed to business LinkedIn on the business profile) |
| Personal `avatar` | Headshot — distinct from the business logo on the business profile |

**Removed from "My Profile"** (these move to the Member Business Profile):
- Business name, website, business address
- Tagline, cover image
- Membership tier, member since date
- Coupon codes, specialties
- Facebook, Instagram, Twitter, business LinkedIn
- Business categories

**Other:**
- Password change remains here
- **New**: A "My Business" card linking to the Member Business Profile page for their company,
  with an "Edit Member Business Profile" action visible only when `user.isBusinessProfileEditor === true`
- All users can always edit their own personal profile regardless of the editor tag

> **GHL Contact fields for "My Profile"**: `firstName`, `lastName`, `email`, `phone`, `title` (native GHL Contact field), plus `bio` and `linkedinUrl` which were previously Contact custom fields. `title` in GHL Contact maps to job title. Only `linkedinUrl` needs to be kept as a Contact custom field (it stays on the contact, separate from any business LinkedIn).

> **Note on `title`**: GHL Contacts have a native `title` field that we have not previously exposed in the UI. This is the right place for it.

### 6. Navigation / Permissions

Two clearly distinct edit surfaces:
- **"My Profile"** (avatar menu) → `Profile.tsx` → edits the user's personal GHL Contact data. Always accessible to any logged-in user.
- **"Edit Member Business Profile"** (on the Member Business Profile page) → `BusinessProfile.tsx` → visible when `user.isBusinessProfileEditor && user.ghlBusinessId === business.id`
- **"Manage Team"** (on the Member Business Profile page, below the edit form) → visible when `user.isBusinessProfileEditor && user.ghlBusinessId === business.id` → shows the team member list; within that section, the editor grant/revoke toggle controls are only rendered when `user.isMainContact === true` or `user.role === 'admin'`

### 7. Admin Page — User & Membership Management (`src/pages/Admin.tsx`)

The existing `users` tab in `Admin.tsx` is redesigned into three sub-tabs using a nested `Tabs` component (or a simple button-group switcher inside the tab content area).

#### Sub-tab: Business Memberships
- **State**: `ghlBusinesses: GHLBusiness[]`, `businessLoading`, `businessSearch`, `businessTierFilter`, `businessCityFilter`
- **Data**: fetched from `GET /admin/businesses?search=&tier=&city=` on mount and on filter change
- **Columns**: Business name, Tier badge, City, Member since, # contacts linked, Actions menu
- **Actions per row**: Set tier (`PATCH /admin/businesses/:id/tier`), View profile (navigate to `/members/:id`), Open in GHL (external link)
- **Pagination**: same pattern as existing users table (limit/offset)

#### Sub-tab: Contacts
- **State**: `ghlContacts: GHLContact[]`, `contactsLoading`, `contactSearch`, `contactBusinessFilter`, `contactTagFilter`
- **Data**: fetched from `GET /admin/contacts?search=&businessId=&tag=` on mount and on filter change
- **Columns**: Name, Email, Phone, Linked Business, Role tags (main-contact / editor badges), Has App Account (boolean indicator)
- **Actions per row**: Toggle `main-contact` tag, Toggle `business-profile-editor` tag, Open in GHL (external link)
- **Pagination**: limit/offset

#### Sub-tab: App Users
- Unchanged from current `users` tab behaviour: `GET /admin/users?search=&role=&status=`
- Add two new indicator columns: **GHL Contact linked** (yes/no) and **GHL Business linked** (yes/no) derived from `user.ghlContactId` and `user.ghlBusinessId`

#### Add New Membership form
- **Trigger**: "Add New Membership" `Button` rendered at the top of the Users admin section, visible only when `currentUser.role === 'admin'`
- **UI**: `Dialog` or `Sheet` with two clearly labelled sections (Contact and Business)
- **State**: `showAddMembershipDialog`, `addMembershipForm: { contact: {...}, business: {...} }`, `addMembershipLoading`
- **Submit**: calls `POST /admin/memberships` — on success, refreshes all three sub-tabs and shows a success toast; on failure, shows an error toast and leaves the form open
- **Validation**: first name, last name, email, and business name are required; email must be a valid format and not already exist in GHL

---

## Migration Path

Since this is a significant structural change, a phased approach is recommended:

### Phase 1 — GHL Business Data Sync (no UI changes)
1. Add `ghlBusinessId` to `User` table (nullable, backward-compatible — no extra permission column needed)
2. Create `BusinessProfile` table in Postgres
3. Add `getBusinesses()`, `getBusinessById()`, `updateBusiness()`, `getContactsByBusinessId()`, `resolveContactBusiness()` to the GHL service ✅ *(already done)*
4. Run **`ghl-api/scripts/bootstrap-ghl-businesses.js`** ✅ *(script written)* — a one-time script that:
   - Fetches all GHL Contacts with the `active` tag
   - Groups them by normalised business name (`businessName` / `companyName` field on the contact)
   - Creates a GHL Business record via `POST /businesses/` (v3) for each unique business that doesn't already exist
   - Links every contact to its business by setting `contact.businessId` via `PUT /contacts/:id`
   - Is idempotent (safe to re-run — existing businesses are detected and skipped)
   - Reports any contacts with no business name so they can be handled manually in GHL

   Run in dry-run mode first (`node scripts/bootstrap-ghl-businesses.js`) to verify the groupings, then run with `--execute`.

5. Write a one-time data migration script that lifts existing profile data off GHL Contacts into `BusinessProfile` rows. **No data re-entry is required from members** — everything already stored on their Contact records is copied across automatically. This script runs *after* step 4, since it depends on contacts already having `businessId` set.

   **For each `User` row with a `ghlContactId`:**
   - Call `GET /contacts/:id` (v3) to retrieve the contact's `businessId` and custom fields
   - Populate `User.ghlBusinessId` from the contact's `businessId`

   **For each unique `ghlBusinessId` encountered** (one `BusinessProfile` row per business, not per contact):
   - Upsert a `BusinessProfile` row using the following custom field mappings from the contact:

   | `BusinessProfile` column | GHL Contact custom field ID | Notes |
   |---|---|---|
   | `avatar` | `331dKIcjgTa8z8a6mu37` | Business logo / profile photo URL |
   | `coverImage` | `3tSDY90RIMPP4W7uQxF9` | Cover/banner image URL |
   | `tagline` | `3PZ7J4UcjLwnzWudAZHi` | Short tagline |
   | `bio` | `b3Yfp0NjO23zFXzwjswu` | Extended bio/description |
   | `memberSince` | `Dxt6gzc4osQhaCBPhslY` | ISO date string |
   | `membershipTier` | derived from contact tags (`elite-member`, `enhanced-member`, etc.) | Same logic as existing `getMembershipTier()` |
   | `couponCodes` | `9rtkCBAUmFZdHs9ALwQl` | JSON-encoded array or comma-separated string |
   | `specialties` | `specialties` custom field | Comma-separated string → `String[]` |
   | `organizationType` | `kPoBTUVldHyg3WbywLJ9` | Organization type |
   | `facebookUrl` | GHL Contact custom field `1Yv2752kZqX9YQD2YWQI` | Moves to `BusinessProfile.facebookUrl` |
   | `instagramUrl` | GHL Contact custom field `VVMVScdl9xkx24OiBZeP` | Moves to `BusinessProfile.instagramUrl` |
   | `twitterUrl` | GHL Contact custom field `acDP54JNNtqdxJh7Ee5h` | Moves to `BusinessProfile.twitterUrl` |
   | `linkedinUrl` | GHL Contact custom field `b5LrmKi7eRpvD8r3FPmQ` | Moves to `BusinessProfile.linkedinUrl` (business LinkedIn); the same custom field also stores personal LinkedIn on the Contact — after migration only the personal LinkedIn copy is retained on the Contact |

   **Deduplication** (multiple contacts can belong to the same business):
   - Use `INSERT ... ON CONFLICT (ghlBusinessId) DO NOTHING` — first contact processed wins
   - To prefer the `main-contact`'s data, sort contacts so any with the `main-contact` tag are processed first

   **Migrate `MemberCategory` rows:**
   - For each `MemberCategory` row with a `ghlContactId`, look up the corresponding `User.ghlBusinessId` and replace `ghlContactId` with `ghlBusinessId`
   - If two contacts from the same business have different category selections, merge (union) them into a single set for that business
6. Verify that `main-contact` tags are already applied in GHL ✅ *(confirmed — no action needed before Phase 3)*. Additional `business-profile-editor` tags can be granted by main contacts via the app at any time after go-live.

### Phase 2 — Backend Dual-Mode
1. Update `membersController` to fetch from Businesses API but merge with existing data
2. Update auth profile enrichment to include `ghlBusinessId` and `isMainContact`
3. Update `PATCH /members/:id` to write to GHL Business + `BusinessProfile` (not Contact)
4. Keep old contact-based endpoints working in parallel during frontend transition

### Phase 3 — Frontend Migration
1. Update `Member` type to `Business` (or keep as alias during transition)
2. Rename `Members.tsx` → `BusinessDirectory.tsx`, `MemberDetails.tsx` → `BusinessProfile.tsx`
3. Update `Profile.tsx` to be purely personal (Contact/User) data, add "My Business" card
4. Update `authStore` to include `ghlBusinessId`, `businessName`, `isMainContact`, and `isBusinessProfileEditor`
5. Gate "Edit Business Profile" on `isBusinessProfileEditor && ghlBusinessId === business.id`
6. Add "Manage Team" section gated on `isBusinessProfileEditor && ghlBusinessId === business.id`

### Phase 4 — Cleanup
1. Remove old contact-based member endpoints
2. Remove `businessName` / `companyName` text fields from the User table and Contact transform where they duplicate Business data
3. Update registration flow to create/associate Business on new account creation
4. **GHL Contact custom field cleanup** *(deferred — do after all feature changes are stable in production)*: The following Contact custom fields will be stale after migration (data moved to `BusinessProfile`). The chamber admin can optionally remove them from the GHL contact field configuration:
   - `cover_image` (`3tSDY90RIMPP4W7uQxF9`)
   - `tagline` (`3PZ7J4UcjLwnzWudAZHi`)
   - `memberSince` (`Dxt6gzc4osQhaCBPhslY`)
   - `membershipType` (`inm2jc52WNhxX8H2FHHm`)
   - `organizationType` (`kPoBTUVldHyg3WbywLJ9`)
   - `couponCodes` (`9rtkCBAUmFZdHs9ALwQl`)
   - `facebookUrl` (`1Yv2752kZqX9YQD2YWQI`)
   - `instagramUrl` (`VVMVScdl9xkx24OiBZeP`)
   - `twitterUrl` (`acDP54JNNtqdxJh7Ee5h`)
   
   The following three Contact custom fields are **retained** (repurposed for personal data on "My Profile"):
   - `bio` (`b3Yfp0NjO23zFXzwjswu`) → personal bio
   - `avatar_url` (`331dKIcjgTa8z8a6mu37`) → personal headshot
   - `linkedinUrl` (`b5LrmKi7eRpvD8r3FPmQ`) → personal LinkedIn

---

## Open Questions

1. **Team member listing on the member business profile page**: Should the profile page show a public "Meet the Team" section listing all GHL Contacts linked to that business? This would call `GET /contacts/business/:businessId`. Useful for visitors to see "who works here", but requires a decision on what personal info to expose (name + headshot + title only — no email/phone) and whether it's visible to everyone or only to logged-in members. *Pending client input.*
