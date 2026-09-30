# Member Referral Program: Phased Implementation Plan

**Feature set**: [feature-set.md](feature-set.md)
**Research**: [research-and-plan.md](research-and-plan.md)

Phases are ordered so each one ships something usable on its own. Tasks
reference the existing conventions used elsewhere in this codebase
(`ghl-api/src/routes/members.ts` + `membersController.ts` pattern,
`Notification`/`DeviceToken` models, `emailService.ts`, Admin tab pattern in
`src/pages/Admin.tsx`).

---

## Phase 1 — Database schema

### 1.1 Add Prisma models (`ghl-api/prisma/schema.prisma`)
- [ ] `Referral` model: `referrerBusinessId`, `referrerUserId`, `recipientBusinessId`,
      `leadName`, `leadContact`, `note`, `temperature`, `status`, `hiddenByAdmin`,
      timestamps — same `Int @id @default(autoincrement())` /
      `@@map(snake_case)` conventions as `Nomination`/`Job`. No dollar-value
      field — closed business value is private between the two parties and
      is not tracked by the platform (client decision).
- [ ] `ReferralTestimonial` model: `referralId`, `authorUserId`, `body`, `createdAt`.
- [ ] `ReferralPoints` model: `businessId @unique`, `points`, `tier`, `updatedAt`.
- [ ] Indexes: `referrerBusinessId`, `recipientBusinessId`, `status`, `createdAt`.

### 1.2 Migration
```bash
cd ghl-api && npx prisma migrate dev --name add-referrals && npx prisma generate
```

---

## Phase 2 — Backend API

**Files**: `ghl-api/src/routes/referrals.ts` (new), `ghl-api/src/controllers/referralsController.ts` (new), register in `ghl-api/src/routes/index.ts`

### 2.1 Controller methods (mirror `membersController.ts` structure)
- [ ] `createReferral` — `POST /referrals` (authenticated) — validates recipient business exists, creates row with `status: "submitted"`.
- [ ] `getMyReferrals` — `GET /referrals/mine?direction=given|received` — filtered by the authenticated user's `ghlBusinessId`.
- [ ] `updateReferralStatus` — `PATCH /referrals/:id/status` — only the recipient business's users may transition status; validates allowed transitions.
- [ ] `addTestimonial` — `POST /referrals/:id/testimonial` — only after `status = closed_won`.
- [ ] `getPublicFeed` — `GET /referrals/feed` — returns all non-`hiddenByAdmin` rows (visible by default, no per-referral opt-in), omitting `leadName`/`leadContact` so only the referrer/recipient business pairing is exposed.
- [ ] `getAdminReferrals` — `GET /admin/referrals` (admin-only, `requireAdmin`) — full list with filters.
- [ ] `adminModerateReferral` — `PATCH /admin/referrals/:id` (admin-only) — hide/override status.

### 2.2 Routing
- [ ] Wire routes in `referrals.ts` using `requireAuth`/`requireAdmin` middleware exactly as `routes/members.ts` does.
- [ ] Register `router` in `ghl-api/src/routes/index.ts`.

---

## Phase 3 — Give-a-referral flow (frontend)

**Files**: `src/components/referrals/ReferReferralDialog.tsx` (new), `src/services/referrals.ts` (new), hook into `src/pages/MemberDetails.tsx` and `src/pages/Members.tsx`

### 3.1 Service layer
- [ ] `src/services/referrals.ts` — `createReferral()`, `getMyReferrals()`, `updateReferralStatus()`, `getPublicFeed()`, `addTestimonial()` using the existing `api` client from `src/services/apiClient.ts`.

### 3.2 UI
- [ ] `ReferReferralDialog` — form (lead name, contact, note, temperature), opened from a "Refer this member" button on `MemberDetails.tsx` and from the member card menu on `Members.tsx`.
- [ ] Success/error toasts consistent with existing form patterns (e.g. `NominationForm.tsx`).

---

## Phase 4 — My Referrals inbox (frontend)

**Files**: `src/pages/Referrals.tsx` (new), `src/routes.tsx`, nav entry

### 4.1 Page
- [ ] Given/Received tabs (reuse `Tabs`/`TabsTrigger` pattern from `YearlyVoting.tsx`).
- [ ] Status badges reusing `src/components/ui/badge.tsx` variants.
- [ ] Status-change controls for the recipient (dropdown → `updateReferralStatus`).

### 4.2 Routing/nav
- [ ] Add `<Route path="referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />` in `src/routes.tsx`.
- [ ] Add a nav link in the member portal nav alongside Discussions/Courses.

---

## Phase 5 — Notifications (reuse existing infra)

**Files**: `ghl-api/src/controllers/referralsController.ts`, `ghl-api/src/services/emailService.ts`

- [ ] On `createReferral`: insert a row via the existing `Notification` model and send push via the existing `DeviceToken` flow (same pattern already used for event reminders / other notifications) targeted at the recipient's `User`.
- [ ] On `createReferral` and `updateReferralStatus`: send email via `emailService.ts`, adding a `referralReceivedEmail` / `referralStatusUpdateEmail` template next to the existing `inviteEmail.ts`-style templates.
- [ ] No new notification infrastructure needed — this phase is template/trigger wiring only.

---

## Phase 6 — Admin tools

**File**: `src/pages/Admin.tsx` (add a `TabsTrigger value="referrals"` alongside the existing `users`/`nominations` tabs)

> Moved ahead of the public feed/leaderboard phases — admin moderation is included in the initial release rather than deferred (client decision).

- [ ] New admin tab: table of all referrals (business pair, status, date, hidden/visible), matching the existing `Badge`-based status rendering used for users/businesses in `Admin.tsx`.
- [ ] Hide/unhide and status-override actions calling `adminModerateReferral`, writing `hiddenByAdmin`.
- [ ] Summary stat cards (total referrals, closed-won count, top connector) at the top of the tab, matching the existing stat-card pattern already in `Admin.tsx` (e.g. `bizTotal`, `usersTotal` badges).

---

## Phase 7 — Public recognition feed & testimonials

**Files**: `src/pages/ReferralFeed.tsx` (new) or a section on the existing community/dashboard page, `src/components/referrals/TestimonialForm.tsx` (new)

- [ ] Feed list consuming `getPublicFeed()`, showing referrer business → recipient business only (never the lead's name/contact), reusing badge visuals from `src/pages/Nominations.tsx`.
- [ ] "Post a thank-you" form gated to `status = closed_won`, shown on the Referrals inbox item.
- [ ] No per-referral privacy toggle needed — occurrence is visible by default for every referral, excluding any `hiddenByAdmin` rows.

---

## Phase 8 — Leaderboard (points, tiers, badges)

**Files**: `ghl-api/src/services/referralPointsService.ts` (new), `src/pages/Leaderboard.tsx` (new — finally implements the type already stubbed in `src/types/member.ts`)

### 8.1 Points engine
- [ ] Point values: referral given (+1), accepted/contacted (+1), closed-won (+5 flat bonus — no dollar-value scaling, since deal size is private and not tracked), testimonial given (+1).
- [ ] Recompute `ReferralPoints.points` transactionally whenever `updateReferralStatus`/`addTestimonial` fires.
- [ ] Tier thresholds (Bronze/Silver/Gold/Platinum) derived from `points`, written to `ReferralPoints.tier`.

### 8.2 Leaderboard UI
- [ ] `GET /referrals/leaderboard?period=month|all` endpoint.
- [ ] `Leaderboard.tsx` page: ranked list with tier badges, monthly/all-time toggle.
- [ ] Route + nav entry in `src/routes.tsx`.

---

## Phase 9 — Testing, feedback & revision round

- [ ] Structured manual test pass across all phases (give/receive/track a referral, status transitions, notifications, admin moderation, public feed, points/leaderboard).
- [ ] Share a build with chamber staff/a few members for feedback.
- [ ] Triage issues found and address them in a revision pass.

---

## Agent implementation time estimate

These numbers are **my own estimated active implementation time** (writing
code, running builds, iterating on this codebase) to produce each phase,
assuming no major blockers. Figures below are the minimum of each phase's
estimated range. They explicitly **exclude**: human code review,
end-to-end/unit test authoring, staging deploys, and any back-and-forth on
requirements beyond the Phase 9 revision round. Treat these as a working
planning input, not a guarantee.

| Phase | Estimated agent implementation time | Cost @ $75/hr |
|---|---|---|
| 1. Database schema | 0.5 hour | $37.50 |
| 2. Backend API | 2 hours | $150 |
| 3. Give-a-referral flow (frontend) | 1.5 hours | $112.50 |
| 4. My Referrals inbox (frontend) | 2 hours | $150 |
| 5. Notifications (reuses existing infra) | 1 hour | $75 |
| 6. Admin tools | 1.5 hours | $112.50 |
| 7. Public feed & testimonials | 2 hours | $150 |
| 8. Leaderboard (points + tiers) | 2.5 hours | $187.50 |
| 9. Testing, feedback & revision round | 3 hours | $225 |
| **Total** | **~16 hours** | **~$1,200** |

Notes on the estimate:
- Admin tools (Phase 6) were moved ahead of the public feed/leaderboard
  phases per client decision to include moderation in the initial release.
- Phase 5 is cheaper than it would otherwise be because this codebase
  already has working `Notification`, `DeviceToken`, and `emailService.ts`
  infrastructure — this phase is template/trigger wiring, not new plumbing.
- The range reflects normal variance in iterating on UI details and fixing
  type errors/build issues as they come up, not open-ended uncertainty.
  Figures above are the low end of that range; treat them as a floor, not
  an average.
- Does not include the lightweight Phase 0 gut-check on leaderboard appeal
  (question 3) from the research doc, which is non-dev work.
- If the "optional add-ons" from the feature set (mobile push polish, GHL
  opportunity automation) are added, add roughly 1-2 hours each. Dollar-value
  tracking was intentionally excluded and is not part of this estimate.
- Cost column assumes a flat $75/hour rate; adjust to your actual rate.
