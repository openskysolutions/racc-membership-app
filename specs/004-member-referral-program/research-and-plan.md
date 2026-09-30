# Member Referral Program: Research & Phased Plan

Status: Discovery draft (not yet scoped/estimated with client)
Author: Prepared for internal planning ahead of client estimate

## 1. Why this doc exists

The client wants members of the chamber to give each other business referrals,
similar to what BNI and other networking groups do, with some kind of
leaderboard layer. We don't yet know the right UX for this chamber's
members (who are not the same audience as a BNI chapter), so this doc:

1. Summarizes how comparable organizations structure referral sharing.
2. Proposes a concept tailored to this app's existing architecture and
   existing leaderboard-style features (Nominations, badges).
3. Flags the open UX questions that should be validated with real chamber
   members/staff before committing to a full build.
4. Lays out a phased implementation plan with rough effort ranges so the
   client can get a directional estimate.

## 2. Research: how other groups do member-to-member referrals

### BNI (Business Network International)
- Weekly chapter meetings, one member per profession/specialty per chapter
  (strict exclusivity) — this is the opposite of an open chamber, where many
  members share the same category.
- Structured meeting agenda: 60-second member "commercial," a rotating
  10-minute deep-dive presentation, and a slot where members pass physical or
  digital referral slips to each other.
- Tracked member stats (in BNI Connect / the BNI mobile app): referrals given,
  referrals received, visitors brought, one-to-one meetings completed,
  testimonials given, and "Thank You For Closed Business" (TYFCB) — the
  dollar value of business that closed as a result of a referral.
- Recognition: chapter leaderboards, Member of the Month, "Top Referrer"
  awards, and a per-member scorecard that's visible to the whole chapter —
  social visibility of participation is a core driver, not just the points.
- One-to-ones (members meeting 1:1 outside the regular meeting to build
  trust) are tracked as their own metric, because BNI's model is explicit
  that referrals follow trust, not cold outreach.

### LeTip International
- Similar structure to BNI (one member per category, regular meetings), but
  the core unit is simply called a "tip" — a lead passed from one member to
  another. Monthly "tip" totals per member are posted, with recognition for
  top contributors. Less emphasis on formal TYFCB tracking than BNI, more on
  raw volume of tips given.

### Alignable
- An open, non-exclusive online network (closer to this chamber's actual
  membership model — many members per category, not one-per-industry).
- Core mechanics are lightweight: public "recommendations" (like a LinkedIn
  recommendation) members write for each other, a local activity feed, and
  a way to explicitly "refer" one connection to another. No hard points
  system — reputation is built through visible recommendations and profile
  completeness, not a scoreboard.

### General chamber-of-commerce norms (most chambers, incl. likely peers of RACC)
- Most chambers do **not** have a formal referral system at all today — it's
  usually informal (ribbon cuttings, mixers, a member directory). Where
  chambers do add structure, it's typically: a "member-to-member discount"
  program, a newsletter "Member Spotlight," or a simple "refer a business for
  membership" form (lead gen for the chamber itself, not peer-to-peer sales
  referrals). A true BNI-style referral economy inside a chamber is
  differentiated and would be a notable value-add if done well.

### Cross-cutting lessons / pitfalls to design around
- **Closing the loop is the single biggest driver of sustained engagement.**
  Programs that let a member submit a referral but never tell them what
  happened to it die quickly. The receiving member should be able to update
  a simple status (contacted → in discussion → closed / not a fit), and the
  referrer should see that update.
- **Visibility beats pure point totals.** A public activity feed ("Jane
  referred Kim's Bakery to Mike's Print Shop") normalizes participation more
  than a private point balance does.
- **Exclusivity-based models (BNI/LeTip) don't map directly to an open
  chamber** where many members share a category — the program should be
  framed as "help a fellow member" rather than "you're the only plumber in
  the room," since RACC likely has multiple plumbers, realtors, etc.
- **Dollar-value tracking (TYFCB-style) is powerful for justifying ROI/dues,
  but it's self-reported and can feel salesy/intrusive for a nonprofit
  chamber** — worth validating appetite before building it, and if included,
  make it optional/private-by-default with an opt-in public display.
- **Anti-gaming guardrails matter once points exist:** cap points for
  repeated referrals to the same business, require the receiving member to
  confirm/accept a referral before it counts, and avoid rewarding volume in
  a way that encourages spammy, low-quality referrals.
- **Non-monetary recognition tends to work better than cash-like rewards**
  for a dues-based nonprofit context — certificates, newsletter/spotlight
  features, an annual "Connector of the Year" award, priority seating at
  events, etc.
- **Privacy/consent**: a referral shares a lead's contact info with a third
  party. The flow should make clear whose information is being shared and
  ideally get consent from the referred lead before full contact details are
  handed over to the receiving member.

## 3. Fit with this codebase (what already exists to build on)

- The app already has a member-facing **Nominations / Business of the Month /
  Customer Service Superstar** system ([src/pages/Nominations.tsx](src/pages/Nominations.tsx),
  [src/pages/YearlyVoting.tsx](src/pages/YearlyVoting.tsx)) with badge imagery and
  voting — this is the existing "leaderboard-style" pattern and visual
  language members are already used to. A referral program should feel like a
  sibling feature, not a bolt-on.
- A `GamificationMeta { points, level }` shape already exists on the member
  type ([src/types/member.ts](src/types/member.ts)) but is currently unused/vestigial —
  the original portal spec ([specs/001-a-membership-portal/spec.md](specs/001-a-membership-portal/spec.md))
  planned a "Leaderboard" that was never built. This referral program is a
  natural excuse to finally build that leaderboard layer for real.
- Members are represented as GHL Businesses (`BusinessMember`) with one or
  more linked GHL Contacts/Users per business ([src/types/member.ts](src/types/member.ts)).
  A referral is naturally a relationship between two *businesses* (or two
  *contacts* acting on behalf of their business) in the directory — reuse the
  existing member directory/search UI as the "who am I referring to" picker.
- There's already an email service used for transactional email (invite
  emails, per [specs/003-company-based-membership/IMPLEMENTATION_TASKS.md](specs/003-company-based-membership/IMPLEMENTATION_TASKS.md))
  that can be reused for referral notifications (new referral received,
  status updates) without building new infra.
- Backend is Express + Prisma ([ghl-api/prisma/schema.prisma](ghl-api/prisma/schema.prisma))
  with GHL as the source of truth for business/contact identity — a new
  `Referral` model (and related tables) fits the existing pattern of
  "local DB tables keyed by `ghlBusinessId`/contact id" already used for
  `BusinessProfile` and `MemberCategory`.

## 4. Proposed concept (working name: "Member Connect")

A lightweight, trust-first referral loop rather than a straight BNI clone,
since RACC members aren't organized into exclusive one-per-category chapters.

### Core loop
1. **Give a referral**: Member A finds Member B in the existing directory and
   submits a referral — who the lead is, contact info, a short note on the
   opportunity, and (optionally) a "temperature" (hot/warm/cold).
2. **Receive & acknowledge**: Member B gets notified (email + in-app), sees
   the referral in a "My Referrals" inbox, and can update its status:
   Contacted → In Discussion → Closed-Won / Closed-Lost / Not a Fit.
3. **Loop closes**: Member A sees the status update. If Closed-Won, Member A
   gets full credit/points; Member B can optionally post a public thank-you
   testimonial ("shout-out"), mirroring BNI's public testimonial culture.
4. **Visibility (decided)**: the fact that a referral took place is shown
   chamber-wide by default — who referred whom (referrer business →
   recipient business) — but the identity and contact details of the lead
   being referred, and any dollar value of closed business, are never shown
   publicly. That stays private between the referrer and the recipient.

### Leaderboard layer (built on top of the above, not required for MVP)
- Points for: referral given (small), referral accepted/contacted by
  recipient (small), referral closed-won (larger), public testimonial given
  (small). Points intentionally weight quality (closed business) over raw
  volume to avoid spammy behavior.
- Simple tiers/badges (e.g., Bronze/Silver/Gold/Platinum Connector) based on
  cumulative points or closed referrals — reuse the existing badge visual
  pattern from Nominations.
- Monthly and all-time leaderboard, finally implementing the
  previously-planned Leaderboard page.
- Optional: monthly/annual recognition ("Connector of the Month") surfaced in
  the newsletter/admin tools, similar to Business of the Month.

### Trust & anti-abuse guardrails
- A referral only "counts" toward points once the recipient acknowledges it
  (prevents self-serving spam submissions).
- Rate/volume caps per week and de-duplication on repeated referrals to the
  same business pairing.
- Referred lead's identity and contact info are only ever visible to the
  referrer and the receiving member — never published in the public activity
  feed, and never surfaced to admins beyond what's needed for moderation.
  Only the two member businesses' names and the referral's occurrence are
  shown publicly.
- Dollar value of closed business is not tracked by the platform at all —
  it's private information between the two parties, decided out of scope.
- Admins can hide/remove abusive or inappropriate entries, mirroring existing
  moderation patterns in Nominations/Admin.

## 5. Open UX questions — status

1. Do members want dollar-value ("closed business value") tracking?
   **Decided: no.** Dollar value of closed business will not be tracked or
   shown anywhere in the app — it's private information between the two
   member businesses involved.
2. Should referrals be visible chamber-wide by default, or private?
   **Decided: shown by default.** The occurrence of a referral (referrer
   business → recipient business) is visible chamber-wide. The identity and
   contact details of the lead being referred are never shown publicly —
   only the two parties involved ever see that.
3. Is a points/leaderboard system actually motivating for this membership
   base, or would simple recognition (badges, spotlight, no points math) be
   enough — and less risk of feeling gamed/gimmicky? **Still open** — worth
   a lightweight gut-check with a few members before investing in Phase 3
   (Leaderboard) below.
4. Should non-members (the person being referred) get a consent step before
   their contact info is shared? **Decided: not needed.** Since the referred
   lead's identity/contact info is never shown to anyone except the two
   member businesses directly involved (same as today's informal
   referrals), there's no new disclosure to get consent for.
5. Do admins need moderation/reporting tools on day one? **Decided: yes.**
   Admin moderation/reporting is included in the initial release rather than
   deferred (see the phased plan below).

Only question 3 remains open. Recommend a short, lightweight check with a
handful of members (not a full discovery phase) before committing budget to
Phase 3 (Leaderboard).

## 6. Rough data model sketch

```prisma
model Referral {
  id                String   @id @default(cuid())
  referrerBusinessId String   // ghlBusinessId of the giving member
  referrerUserId     String   // contact who submitted it
  recipientBusinessId String  // ghlBusinessId of the receiving member
  leadName          String   // never shown outside the two parties
  leadContact       String   // email or phone, visible only to referrer + recipient
  note              String?
  temperature       String?  // hot | warm | cold
  status            String   @default("submitted") // submitted | contacted | in_discussion | closed_won | closed_lost | not_a_fit
  hiddenByAdmin     Boolean  @default(false) // admin moderation only; occurrence is public by default otherwise
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model ReferralTestimonial {
  id          String   @id @default(cuid())
  referralId  String
  authorUserId String
  body        String
  createdAt   DateTime @default(now())
}

model ReferralPoints {
  id          String   @id @default(cuid())
  businessId  String   @unique // ghlBusinessId
  points      Int      @default(0)
  tier        String   @default("none") // bronze | silver | gold | platinum
  updatedAt   DateTime @updatedAt
}
```

## 7. Phased implementation plan & rough estimate

Estimates are **order-of-magnitude** (developer effort ranges), assuming a
developer already familiar with this codebase's patterns (GHL service layer,
Prisma, existing Admin/Nominations UI conventions). Convert to $ at your
team's rate; refine after Phase 0.

| Phase | Scope | Rough effort |
|---|---|---|
| **0. Discovery & UX validation** | Four of five open questions from §5 are now decided (see above). Remaining: a lightweight gut-check with a few members on whether points/leaderboards (question 3) are actually motivating before committing to Phase 3. | 2-3 days (non-dev) |
| **1. MVP referral loop + admin tools** | `Referral` model + API, "Refer a member" flow from the directory, "My Referrals" inbox (given/received), status updates, email notifications reusing existing email service, and admin moderation/reporting tools. No points/leaderboard yet. | ~3-4 weeks (~90-130 dev hrs) |
| **2. Public activity & recognition** | Chamber-wide activity feed showing referral occurrences (referrer → recipient only, lead identity always private) and testimonials, reusing Nominations-style badge visuals for a "Thank you" UI. | ~1.5 weeks (~40-60 dev hrs) |
| **3. Leaderboard layer** | Points engine, tiers/badges, Leaderboard page (finally implementing the long-planned feature), monthly "Connector" recognition surfaced to admins/newsletter. | ~2-3 weeks (~60-90 dev hrs) |
| **4. Polish & advanced** | Push/mobile notifications (Capacitor), analytics dashboard for admins (referral volume, close rate, top connectors), possible GHL workflow/automation hooks (e.g., auto-create a GHL opportunity from a closed-won referral). | ~2-3 weeks (~60-90 dev hrs) |

**Directional total (Phases 1-4): roughly 8-12 weeks / ~250-370 dev hours**,
with the lightweight Phase 0 gut-check run in parallel/ahead to make sure
Phase 3 (Leaderboard) is actually worth building as scoped, versus shipping
Phase 1 and re-evaluating based on real adoption data first.

### Suggested sequencing for the client conversation
- Pitch Phase 1 as the initial commitment ("prove members actually use a
  simple give/receive/close-the-loop referral flow, with admin oversight
  built in from day one").
- Treat Phases 2-4 (public feed, leaderboard, polish) as a follow-on
  scope-of-work once Phase 1 usage data validates member interest — avoids
  over-building a points economy nobody asked for.

## 8. Suggested next steps

1. Run the lightweight Phase 0 gut-check on question 3 only (points/
   leaderboard appeal) — a few conversations, not a formal discovery phase.
2. Quote and kick off Phase 1 (MVP referral loop + admin tools), which is
   now fully scoped since questions 1, 2, 4, and 5 are decided.
3. Defer the Phase 3 leaderboard go/no-go decision until Phase 1 usage
   data (and the Phase 0 gut-check) are both in hand.
