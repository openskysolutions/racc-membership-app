# Board Member Elections: Research & Phased Plan

Status: Discovery draft (not yet scoped/estimated with client)
Author: Prepared for internal planning ahead of client estimate

## 1. Why this doc exists

The client wants chamber members to elect board members through the app:
board members add open positions, nominate chamber members for those
positions, set a voting window, and manually close voting and publish
results once votes are counted. This doc:

1. Summarizes how this fits the existing architecture.
2. Flags the open questions that should be confirmed before a full build.
3. Lays out a phased implementation plan with an agent-hour estimate.

## 2. Fit with this codebase (what already exists to build on)

- The app already has a board-only nomination/voting system for Business of
  the Month awards ([ghl-api/prisma/schema.prisma](ghl-api/prisma/schema.prisma)
  `Nomination`/`Vote` models, [ghl-api/src/controllers/nominationsController.ts](ghl-api/src/controllers/nominationsController.ts),
  [src/pages/Voting.tsx](src/pages/Voting.tsx), [src/pages/YearlyVoting.tsx](src/pages/YearlyVoting.tsx)).
  That system is **board-members-voting-on-nominees**, which is the opposite
  direction of this feature (**all members voting on board candidates**), so
  this is built as a new, separate module (`ElectionPosition`/
  `ElectionCandidate`/`ElectionVote`) rather than extending `Nomination`/`Vote`.
- Role-based middleware already distinguishes the roles this feature needs:
  `requireBoardMember` (admin/moderator/board_member) for managing elections,
  and a general authenticated-active-member check for casting a vote, matching
  the `ActiveMemberRoute` pattern already used for `yearly-voting` in
  [src/routes.tsx](src/routes.tsx).
- [src/pages/BoardMembers.tsx](src/pages/BoardMembers.tsx) currently lists board
  members as static hardcoded data (not from GHL or the DB) — this feature
  doesn't touch that page; candidates are stored as plain name/business text
  fields on `ElectionCandidate`, the same simple pattern `Nomination` already
  uses for `name`/`businessName` rather than a live GHL contact link.
- [src/components/nominations/BusinessSearchCombobox.tsx](src/components/nominations/BusinessSearchCombobox.tsx)
  already implements a searchable member/business picker with a "custom
  entry" fallback — reusable as-is (or lightly adapted) for the "add a
  candidate" admin UI instead of building a new search component.
- Admin UI already has an established tab pattern in
  [src/pages/Admin.tsx](src/pages/Admin.tsx) (`TabsTrigger` per section,
  e.g. `nominations`, `monthly-results`, `yearly-results`) and a dedicated
  management page pattern in [src/pages/admin/NominationsManagement.tsx](src/pages/admin/NominationsManagement.tsx)
  — the new "Elections" admin tab/page follows the same structure.
- Notifications and email are already wired infrastructure
  (`Notification`/`DeviceToken` models, existing `emailService.ts` templates)
  — Phase 5 below is template/trigger wiring only, not new plumbing.

## 3. Proposed concept

### Core loop

1. **Set up**: a board member/admin creates a position (title, description,
   seats available) and adds nominated candidates to it.
2. **Voting window**: the board member/admin sets a start/end date-time.
   Voting opens automatically at the start time and stops accepting votes
   automatically at the end time, but a board member/admin can also force
   voting closed early at any point.
3. **Vote**: every active member sees open positions on a ballot page and
   selects up to the number of available seats, once per position.
4. **Manual publish**: closing voting (automatic or manual) does **not**
   reveal results. Results stay hidden until a board member/admin explicitly
   clicks "Publish Results," satisfying the requirement that votes can be
   reviewed/counted before anyone sees an outcome.
5. **Results**: once published, all members can see winner(s) per position;
   admins/board additionally see the full tally.

### Status lifecycle (`ElectionPosition.status`)

`draft` → `nominations` → `voting_open` → `voting_closed` → `results_published`

## 4. Open questions — status

1. **Who can vote?** Assumed: every active chamber member (not just board
   members), since the request describes a chamber-wide election rather than
   a board-only vote. **Needs client confirmation** — if voting should
   actually be restricted to existing board members only, this narrows to
   reusing the existing `requireBoardMember` middleware instead of an
   active-member check, which is a smaller change.
2. **Self-nomination**: assumed out of scope for v1 — only board/admin add
   candidates. Flagged in the feature set as excluded; can be added later as
   a public nomination form mirroring the existing `Nominations.tsx` pattern.
3. **Multi-seat tie-breaking**: if a position has multiple seats and there's
   a tie for the last seat, v1 shows the tie as-is (both candidates marked
   winners) rather than an automatic tiebreaker — flag for client sign-off.
4. **Vote count visibility after publish**: assumed members only see
   winner(s), not the full tally (only admins/board see full counts). Easy
   to flip to fully public counts if preferred.

## 5. Phased implementation plan

### Phase 1 — Database schema

- `ElectionPosition` model: `title`, `description`, `seatsAvailable`,
  `status`, `votingStartAt`, `votingEndAt`, `votingClosedManually`,
  `resultsPublishedAt`, timestamps — same `Int @id @default(autoincrement())`
  / `@@map(snake_case)` conventions as `Nomination`.
- `ElectionCandidate` model: `positionId`, `name`, `businessName`,
  `statement`, timestamps.
- `ElectionVote` model: `positionId`, `candidateId`, `voterId`, timestamps,
  `@@unique([positionId, candidateId, voterId])` to prevent duplicate votes
  for the same candidate.
- Migration: `cd ghl-api && npx prisma migrate dev --name add-elections && npx prisma generate`.

### Phase 2 — Backend API

**Files**: `ghl-api/src/routes/elections.ts` (new), `ghl-api/src/controllers/electionsController.ts` (new), register in `ghl-api/src/routes/index.ts`

- `createPosition` / `listPositions` / `getPosition` / `updatePosition` / `deletePosition` — `requireBoardMember`.
- `addCandidate` / `removeCandidate` — `requireBoardMember`.
- `castVote` — `POST /elections/:positionId/vote` — `requireAuth` + active-member check; validates voting window is open, enforces seat limit and one-ballot-per-member.
- `closeVoting` — `PATCH /elections/:positionId/close` — `requireBoardMember`; sets `votingClosedManually` or is a no-op if already past `votingEndAt`.
- `publishResults` — `PATCH /elections/:positionId/publish` — `requireBoardMember`; only allowed once voting is closed (scheduled or manual).
- `getResults` — `GET /elections/:positionId/results` — public/member view returns winners only once published; `requireBoardMember` view returns full tally at any time.

### Phase 3 — Admin/board management UI

**Files**: `src/pages/admin/ElectionsManagement.tsx` (new), reuse `BusinessSearchCombobox.tsx` pattern for candidate entry, new tab in `src/pages/Admin.tsx`

- Position list with status badges, create/edit form (title, description, seats, voting start/end pickers).
- Candidate add/remove UI per position.
- "Close Voting" and "Publish Results" actions with confirmation dialogs; live tally visible to board/admin pre-publish.

### Phase 4 — Member-facing voting UI

**Files**: `src/pages/BoardElectionVoting.tsx` (new), `src/services/elections.ts` (new), route + nav entry in `src/routes.tsx` using the existing `ActiveMemberRoute` pattern

- Ballot page: open positions, candidate cards, select-up-to-seats control, submit, "already voted" state.
- Results page/section: winners once published (reuses `Badge`/`Card` components already used in `YearlyVoting.tsx`).

### Phase 5 — Notifications (reuses existing infra)

**Files**: `ghl-api/src/controllers/electionsController.ts`, `ghl-api/src/services/emailService.ts`

- On voting open and on results published: `Notification` row + push via existing `DeviceToken` flow, and an email via `emailService.ts` (new template next to existing ones).

### Phase 6 — Self-testing & revision pass

- Full manual walkthrough: create position → add candidates → open voting → vote as a member → close voting → publish → verify results view for member vs. board/admin.
- Fix issues found; verify the new admin page follows the existing mobile-build-exclusion pattern (lazy-loaded, excluded from Capacitor bundle like other admin pages in `src/routes.tsx`).

## 6. Agent implementation time estimate

These numbers are **my own estimated active implementation time** (writing
code, running builds, iterating on this codebase) to produce each phase,
assuming no major blockers. They explicitly **exclude**: human code review,
end-to-end/unit test authoring, staging deploys, and any back-and-forth on
requirements beyond the Phase 6 revision pass. Treat these as a working
planning input, not a guarantee.


| Phase                                    | Estimated agent implementation time | Cost @ $75/hr |
| ---------------------------------------- | ----------------------------------- | ------------- |
| 1. Database schema                       | 0.5 hour                            | $37.50        |
| 2. Backend API                           | 1 hour                              | $75.00        |
| 3. Admin/board management UI             | 1 hour                              | $75.00        |
| 4. Member-facing voting UI               | 0.5 hour                            | $37.50        |
| 5. Notifications (reuses existing infra) | 0.5 hour                            | $37.5         |
| 6. Self-testing & revision pass          | 0.5 hour                            | $37.50        |
| **Total**                                | **~4 hours**                        | **~$300**     |

Notes on the estimate:

- Phase 5 is cheap because this codebase already has working `Notification`,
  `DeviceToken`, and `emailService.ts` infrastructure — this phase is
  template/trigger wiring, not new plumbing.
- If question 1 (who can vote) is answered as "board members only," Phase 4
  shrinks slightly since it can reuse `AdminRoute` instead of building an
  active-member ballot flow — not reflected above, treat as a minor variance.
- Does not include a stakeholder feedback/revision round beyond my own
  self-testing pass, per the request to exclude external developer/tester
  time from this estimate.
- Cost column assumes a flat $75/hour rate; adjust to your actual rate.
