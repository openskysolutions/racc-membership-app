# Renewal Date Check Flow Diagram

## Login Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ATTEMPTS LOGIN                          │
│                     (Email + Password + PKCE)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 1: Database Password Check                   │
│                  databaseService.verifyPassword()                    │
└──────────────┬───────────────────────────────┬──────────────────────┘
               │                               │
         ✅ Valid                          ❌ Invalid
               │                               │
               ▼                               ▼
┌──────────────────────────────┐   ┌─────────────────────────────────┐
│  STEP 2: GHL Active Check    │   │  401 Unauthorized               │
│  ghlService.isUserActive()   │   │  "Invalid email or password"    │
└─────────┬────────────────────┘   └─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Find Contact in GoHighLevel                        │
│                   Search by Email Address                            │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
         ✅ Found                        ❌ Not Found
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌─────────────────────────────────┐
│  Check for 'active' Tag      │   │  403 Forbidden                  │
└─────────┬────────────────────┘   │  "Contact not found"            │
          │                        └─────────────────────────────────┘
    ✅ Has Tag    ❌ No Tag
          │            │
          │            ▼
          │   ┌─────────────────────────────────┐
          │   │  403 Forbidden                  │
          │   │  "Missing active tag"           │
          │   └─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Extract contact.renewal_date from Contact                │
│   Look in: customField[] array OR customFields{} object             │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
         ✅ Found                        ❌ Not Found
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌─────────────────────────────────┐
│  Parse Date                  │   │  403 Forbidden                  │
│  Convert to Date Object      │   │  "No renewal date found"        │
└─────────┬────────────────────┘   └─────────────────────────────────┘
          │
    ✅ Valid    ❌ Invalid
          │            │
          │            ▼
          │   ┌─────────────────────────────────┐
          │   │  403 Forbidden                  │
          │   │  "No renewal date found"        │
          │   └─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Calculate Time Since Renewal                      │
│        thirteenMonthsAgo = now.setMonth(now.getMonth() - 13)        │
│              isValid = renewDate >= thirteenMonthsAgo                │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
      ✅ < 13 months                   ❌ > 13 months
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌─────────────────────────────────┐
│  ✅ LOGIN SUCCESSFUL         │   │  403 Forbidden                  │
│                              │   │  "Membership expired -          │
│  - Generate Auth Code        │   │   renewal date is more than     │
│  - Create Session            │   │   13 months old"                │
│  - Return User Data          │   └─────────────────────────────────┘
└──────────────────────────────┘
```

## Renewal Date Validation Logic

```
Current Date: November 17, 2025
13 Months Ago: October 17, 2024

┌─────────────────────────────────────────────────────────────────────┐
│                        Renewal Date Examples                         │
├──────────────────────┬──────────────────┬────────────────────────────┤
│   Renewal Date       │   Months Ago     │         Result             │
├──────────────────────┼──────────────────┼────────────────────────────┤
│  Nov 15, 2025        │       0          │  ✅ VALID (Current)        │
│  Aug 20, 2025        │       3          │  ✅ VALID                  │
│  Jan 10, 2025        │      10          │  ✅ VALID                  │
│  Nov 17, 2024        │      12          │  ✅ VALID (Exactly 12)     │
│  Oct 20, 2024        │      13          │  ✅ VALID (Just under 13)  │
│  Oct 17, 2024        │      13          │  ✅ VALID (Exactly 13)     │
│  Oct 16, 2024        │      13+         │  ❌ EXPIRED (Over 13)      │
│  Sep 15, 2024        │      14          │  ❌ EXPIRED                │
│  Jan 01, 2024        │      22          │  ❌ EXPIRED                │
│  (empty/null)        │      N/A         │  ❌ NO DATE                │
└──────────────────────┴──────────────────┴────────────────────────────┘
```

## Error Message Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Login Denied (403)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Check Reason Field  │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌───────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│ "Contact not      │  │ "Missing     │  │ "No renewal date    │
│  found"           │  │  active tag" │  │  found"             │
│                   │  │              │  │                     │
│ Action:           │  │ Action:      │  │ Action:             │
│ - Check email     │  │ - Add tag in │  │ - Set renewal date  │
│ - Verify GHL has  │  │   GHL        │  │   in GHL            │
│   contact         │  │              │  │                     │
└───────────────────┘  └──────────────┘  └─────────────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Display to User:     │
                    │ "Please contact      │
                    │  support to          │
                    │  renew membership"   │
                    └──────────────────────┘
```

## Development vs Production Behavior

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Check NODE_ENV                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌───────────────────────┐              ┌─────────────────────────────┐
│  development          │              │  production                 │
│                       │              │                             │
│  ✅ Skip all checks   │              │  ✅ Check password          │
│  ✅ Mock responses    │              │  ✅ Check active tag        │
│  ✅ Always allow      │              │  ✅ Check renewal date      │
│  ✅ Give admin role   │              │  ✅ Enforce 13-month rule   │
│                       │              │                             │
│  Use for:             │              │  Use for:                   │
│  - Local dev          │              │  - Staging                  │
│  - Testing            │              │  - Production               │
│  - No GHL API needed  │              │  - Real authentication      │
└───────────────────────┘              └─────────────────────────────┘
```

## Key Decision Points

### 1. Contact Lookup
```
Search GoHighLevel by Email
├─ Found → Continue
└─ Not Found → DENY ("Contact not found")
```

### 2. Active Tag Check
```
Check contact.tags[] for 'active'
├─ Has 'active' → Continue
└─ No 'active' → DENY ("Missing active tag")
```

### 3. Renewal Date Extraction
```
Look for contact.renewal_date
├─ In customField[] array (id/key = 'contact.renewal_date')
├─ In customFields{} object (key = 'contact.renewal_date')
├─ Found & Valid → Continue
└─ Not Found or Invalid → DENY ("No renewal date found")
```

### 4. Date Validation
```
renewDate >= (today - 13 months)
├─ True → ALLOW ✅
└─ False → DENY ("Membership expired")
```

## Summary

| Check | Pass Condition | Fail Response |
|-------|---------------|---------------|
| 1. Database Password | Bcrypt hash matches | 401 "Invalid email or password" |
| 2. Contact Exists | Found in GoHighLevel | 403 "Contact not found" |
| 3. Active Tag | Has 'active' tag | 403 "Missing active tag" |
| 4. Renewal Date Exists | Field is populated | 403 "No renewal date found" |
| 5. Renewal Date Valid | < 13 months old | 403 "Membership expired" |

All checks must pass for successful login.
