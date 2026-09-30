# Board Member Elections: Implementation Tasks

**Feature set**: [feature-set.md](feature-set.md)
**Research & plan**: [research-and-plan.md](research-and-plan.md)

Tasks reference existing conventions used elsewhere in this codebase
(`ghl-api/src/routes/nominations.ts` + `nominationsController.ts` pattern,
`requireBoardMember`/`requireAuth` middleware, `Notification`/`DeviceToken`
models, `emailService.ts`, Admin tab pattern in `src/pages/Admin.tsx`,
`ActiveMemberRoute` in `src/routes.tsx`).

---

## Phase 1 — Database schema

### 1.1 Add Prisma models (`ghl-api/prisma/schema.prisma`)
- [ ] `ElectionPosition` model: `title`, `description`, `seatsAvailable`,
      `status` (`draft`/`nominations`/`voting_open`/`voting_closed`/`results_published`),
      `votingStartAt`, `votingEndAt`, `votingClosedManually`,
      `resultsPublishedAt`, timestamps.
- [ ] `ElectionCandidate` model: `positionId`, `name`, `businessName`,
      `statement`, timestamps.
- [ ] `ElectionVote` model: `positionId`, `candidateId`, `voterId`,
      `createdAt`, `@@unique([positionId, candidateId, voterId])`.
- [ ] Indexes: `positionId` on candidate/vote, `status` on position.

### 1.2 Migration
```bash
cd ghl-api && npx prisma migrate dev --name add-elections && npx prisma generate
```

---

## Phase 2 — Backend API

**Files**: `ghl-api/src/routes/elections.ts` (new), `ghl-api/src/controllers/electionsController.ts` (new), register in `ghl-api/src/routes/index.ts`

### 2.1 Controller methods (mirror `nominationsController.ts` structure)
- [ ] `createPosition` — `POST /elections` (`requireBoardMember`).
- [ ] `listPositions` — `GET /elections` — members see only `voting_open`/`results_published`; board/admin see all via a `?all=true` query gated by `requireBoardMember`.
- [ ] `getPosition` — `GET /elections/:id`.
- [ ] `updatePosition` — `PATCH /elections/:id` (`requireBoardMember`) — only editable before `voting_open`.
- [ ] `deletePosition` — `DELETE /elections/:id` (`requireBoardMember`).
- [ ] `addCandidate` / `removeCandidate` — `POST`/`DELETE /elections/:id/candidates` (`requireBoardMember`).
- [ ] `castVote` — `POST /elections/:id/vote` (`requireAuth`, active-member check) — validates voting window open, enforces `seatsAvailable` max selections and one-ballot-per-member (`@@unique` catch → 409).
- [ ] `closeVoting` — `PATCH /elections/:id/close` (`requireBoardMember`) — sets `votingClosedManually=true`, status → `voting_closed`.
- [ ] `reopenVoting` — `PATCH /elections/:id/reopen` (`requireBoardMember`) — only allowed if not yet `results_published`.
- [ ] `publishResults` — `PATCH /elections/:id/publish` (`requireBoardMember`) — only allowed from `voting_closed`; computes winner(s) by vote count, top `seatsAvailable` candidates.
- [ ] `getResults` — `GET /elections/:id/results` — members get winners-only once published; `requireBoardMember` view returns full per-candidate tally regardless of publish state.

### 2.2 Routing
- [ ] Wire routes in `elections.ts` using `requireAuth`/`requireBoardMember` middleware exactly as `routes/nominations.ts` does.
- [ ] Register router in `ghl-api/src/routes/index.ts`.
- [ ] Add Swagger doc comments matching existing route style.

---

## Phase 3 — Admin/board management UI

**Files**: `src/pages/admin/ElectionsManagement.tsx` (new), `src/pages/Admin.tsx`

### 3.1 Position list & form
- [ ] `ElectionsManagement.tsx` — list positions with status `Badge` (mirrors `NominationsManagement.tsx` status badge pattern).
- [ ] Create/edit form: title, description, seats available, voting start/end date-time pickers.
- [ ] Delete confirmation dialog (`AlertDialog`, mirrors existing delete pattern in `NominationsManagement.tsx`).

### 3.2 Candidate management
- [ ] Add-candidate form within a position's detail view (name, business name, statement) — adapt `BusinessSearchCombobox.tsx` for member lookup with a "custom entry" fallback, same as nominations.
- [ ] Remove-candidate action.

### 3.3 Voting controls
- [ ] "Close Voting" button + confirmation dialog, calling `closeVoting`.
- [ ] "Publish Results" button + confirmation dialog, calling `publishResults`, disabled until status is `voting_closed`.
- [ ] "Reopen Voting" action for `voting_closed` (pre-publish only).
- [ ] Live tally view (board/admin only) visible before publish.

### 3.4 Nav
- [ ] Add `TabsTrigger value="elections"` in `src/pages/Admin.tsx` alongside existing `nominations`/`monthly-results` tabs.

---

## Phase 4 — Member-facing voting UI

**Files**: `src/pages/BoardElectionVoting.tsx` (new), `src/services/elections.ts` (new), `src/routes.tsx`

### 4.1 Service layer
- [ ] `src/services/elections.ts` — `getOpenPositions()`, `castVote()`, `getResults()` using the existing `api` client from `src/services/apiClient.ts`.

### 4.2 Ballot UI
- [ ] `BoardElectionVoting.tsx` — list of open positions, candidate cards (name, business, statement), select-up-to-`seatsAvailable` control, submit button.
- [ ] "Already voted" state per position after submission.
- [ ] Results section/page for `results_published` positions — winner(s) highlighted, reusing `Card`/`Badge` patterns from `YearlyVoting.tsx`.

### 4.3 Routing/nav
- [ ] Add `<Route path="board-elections" element={<ActiveMemberRoute><BoardElectionVotingPage /></ActiveMemberRoute>} />` in `src/routes.tsx`, matching the existing `yearly-voting` route pattern.
- [ ] Add a nav link in the member portal nav.

---

## Phase 5 — Notifications (reuse existing infra)

**Files**: `ghl-api/src/controllers/electionsController.ts`, `ghl-api/src/services/emailService.ts`

- [ ] On voting opening (scheduled transition to `voting_open`): create `Notification` rows + push via existing `DeviceToken` flow for all active members.
- [ ] On `publishResults`: `Notification` + push to all active members.
- [ ] Optional email via `emailService.ts`, adding an `electionVotingOpenEmail`/`electionResultsPublishedEmail` template next to existing templates.
- [ ] No new notification infrastructure needed — this phase is template/trigger wiring only.

---

## Phase 6 — Self-testing & revision pass

- [ ] Manual walkthrough: create position → add candidates → open voting (scheduled + manual close) → vote as a member → attempt duplicate vote (expect rejection) → publish results → verify member view (winners only) vs. board/admin view (full tally).
- [ ] Verify `ElectionsManagement.tsx` follows the existing lazy-load/mobile-exclusion pattern already used for other admin pages in `src/routes.tsx`.
- [ ] Fix issues found during the walkthrough.

---

See [research-and-plan.md](research-and-plan.md) for the agent implementation
time estimate per phase.
