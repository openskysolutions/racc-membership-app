# Tasks: Membership Portal & Marketing Site

**Input**: Design documents from `/specs/001-a-membership-portal/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Codebase Evaluation Summary

**COMPLETED TASKS (4):**
- T002: Frontend ESLint/build setup ✅
- T028: API client wrapper with HighLevel headers ✅  
- T030: Members browse and detail pages ✅
- T035: CORS enabled ✅

**PARTIAL IMPLEMENTATIONS (6):**
- T001: Backend exists, needs test tooling
- T003: Swagger deps present, setup commented out
- T014: Member interface exists, needs other entities + backend models
- T027: **CRITICAL** - Current auth uses Firebase (NOT PKCE), localStorage (VIOLATES constitution)
- T029: Nominations page exists but shows member list (NOT nomination form per spec)
- T034: Basic error handler exists, needs middleware structure
- T036: Swagger setup exists but commented out
- T040: README exists, needs auth/API sections

**MAJOR GAPS:**
- No test directories in frontend or backend
- No backend services, models, or policies directories
- Calendar and Discussions pages are stubs only
- Auth implementation violates Constitution (localStorage vs memory/session storage)

**CONSTITUTIONAL VIOLATIONS:**
- Current auth stores tokens in localStorage (violates "ephemeral tokens in memory/sessionStorage")
- No PKCE implementation (violates "Better Auth PKCE" requirement)

## Execution Flow (main)
```
1. Load plan.md → extracted tech stack and structure (frontend at /src, backend at /ghl-api)
2. Load data-model.md → extracted entities
3. Load contracts/openapi.yaml → extracted endpoints
4. Load research.md → extracted PKCE/session, PIT usage, concurrency, limits, moderation
5. Generate tasks: setup → tests → models → services → endpoints → polish
6. Number + dependencies + [P] markers
7. Validate completeness
8. Return SUCCESS
```

## Phase 3.1: Setup
- [ ] T001 Ensure backend project is ready at `/Users/schott/Projects/racc-membership-app/ghl-api` and add test tooling (Jest or Vitest + supertest); add scripts to `ghl-api/package.json`
  **STATUS: PARTIAL** - Backend exists with Express 5, swagger deps present, but no test tooling/scripts
- [x] T002 [P] Add ESLint and type checks to frontend and verify Vite build passes (root `package.json`)
  **STATUS: COMPLETED** - ESLint configured, build/lint scripts present
- [ ] T003 [P] Create backend OpenAPI stub sync job to serve `/specs/001-a-membership-portal/contracts/openapi.yaml` via Swagger UI in `ghl-api/src/app.js`
  **STATUS: PARTIAL** - Swagger deps present, commented-out setup in app.js

## Phase 3.2: Tests First (TDD)
Contract tests (one per endpoint group) [P]:
- [ ] T004 [P] Contract tests for auth session (POST /auth/session) in `/Users/schott/Projects/racc-membership-app/ghl-api/tests/contract/auth.session.test.ts`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T005 [P] Contract tests for nominations (POST /nominations) in `/Users/schott/Projects/racc-membership-app/ghl-api/tests/contract/nominations.test.ts`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T006 [P] Contract tests for members (GET /members) in `/Users/schott/Projects/racc-membership-app/ghl-api/tests/contract/members.test.ts`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T007 [P] Contract tests for events (GET/POST/PATCH/DELETE /events[/{id}]) in `/Users/schott/Projects/racc-membership-app/ghl-api/tests/contract/events.test.ts`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T008 [P] Contract tests for moderation (POST/PATCH /moderation/posts/{id}) in `/Users/schott/Projects/racc-membership-app/ghl-api/tests/contract/moderation.test.ts`
  **STATUS: NOT STARTED** - No tests directory exists

Integration tests from user stories [P]:
- [ ] T009 [P] Integration test: full auth flow + session persistence (frontend) in `/Users/schott/Projects/racc-membership-app/src/tests/integration/auth.flow.test.tsx`
  **STATUS: NOT STARTED** - No tests directory exists in frontend
- [ ] T010 [P] Integration test: nomination submission (frontend) in `/Users/schott/Projects/racc-membership-app/src/tests/integration/nominations.test.tsx`
  **STATUS: NOT STARTED** - No tests directory exists in frontend
- [ ] T011 [P] Integration test: members browse and open profile (frontend) in `/Users/schott/Projects/racc-membership-app/src/tests/integration/members.browse.test.tsx`
  **STATUS: NOT STARTED** - No tests directory exists in frontend
- [ ] T012 [P] Integration test: calendar CRUD with permissions (frontend) in `/Users/schott/Projects/racc-membership-app/src/tests/integration/calendar.crud.test.tsx`
  **STATUS: NOT STARTED** - No tests directory exists in frontend
- [ ] T013 [P] Integration test: moderation flow (report → hide/remove) (frontend) in `/Users/schott/Projects/racc-membership-app/src/tests/integration/moderation.flow.test.tsx`
  **STATUS: NOT STARTED** - No tests directory exists in frontend

## Phase 3.3: Core Implementation (ONLY after tests are failing)
Models (from data-model.md) [P]:
- [ ] T014 [P] Define TS interfaces/schemas for Member, Nomination, Event, DiscussionTopic, DiscussionPost, Course, CourseProgress, JobListing, News, ModerationLog, Role, ContentLimitPolicy in `/Users/schott/Projects/racc-membership-app/ghl-api/src/models/index.ts`
  **STATUS: PARTIAL** - Member interface exists in `/src/types/member.ts`, needs backend models + other entities

Services (backend) and policies:
- [ ] T015 Implement AuthSession service (PKCE token exchange boundary + session record) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/services/authSession.js`
  **STATUS: NOT STARTED** - No services directory exists
- [ ] T016 Implement Nominations service (create) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/services/nominations.js`
  **STATUS: NOT STARTED** - No services directory exists
- [ ] T017 Implement Members service (list) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/services/members.js`
  **STATUS: NOT STARTED** - No services directory exists
- [ ] T018 Implement Events service (list/create/update/delete with version check) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/services/events.js`
  **STATUS: NOT STARTED** - No services directory exists
- [ ] T019 Implement Moderation service (report/hide/remove/restore, log actions) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/services/moderation.js`
  **STATUS: NOT STARTED** - No services directory exists
- [ ] T020 Implement Content Limit Policy enforcement (per-member counts) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/policies/limits.js`
  **STATUS: NOT STARTED** - No policies directory exists
- [ ] T021 Implement Role/Permission checks for content management in `/Users/schott/Projects/racc-membership-app/ghl-api/src/policies/permissions.js`
  **STATUS: NOT STARTED** - No policies directory exists

Endpoints (backend):
- [ ] T022 Wire POST /auth/session in `/Users/schott/Projects/racc-membership-app/ghl-api/src/routes/auth.js`
  **STATUS: NOT STARTED** - Routes exist but no auth.js
- [ ] T023 Wire POST /nominations in `/Users/schott/Projects/racc-membership-app/ghl-api/src/routes/nominations.js`
  **STATUS: NOT STARTED** - Routes exist but no nominations.js
- [ ] T024 Wire GET /members in `/Users/schott/Projects/racc-membership-app/ghl-api/src/routes/members.js`
  **STATUS: NOT STARTED** - Routes exist but no members.js
- [ ] T025 Wire GET/POST /events and PATCH/DELETE /events/:id in `/Users/schott/Projects/racc-membership-app/ghl-api/src/routes/events.js`
  **STATUS: NOT STARTED** - Routes exist but no events.js
- [ ] T026 Wire POST /moderation/posts/:id (report) and PATCH /moderation/posts/:id (moderate) in `/Users/schott/Projects/racc-membership-app/ghl-api/src/routes/moderation.js`
  **STATUS: NOT STARTED** - Routes exist but no moderation.js

Frontend services and pages:
- [ ] T027 Implement Better Auth PKCE client boundary and session store in `/Users/schott/Projects/racc-membership-app/src/services/auth.ts` and `/Users/schott/Projects/racc-membership-app/src/stores/authStore.ts`
  **STATUS: PARTIAL** - Current auth.ts uses Firebase custom token flow (NOT PKCE); authStore.ts exists with localStorage persistence (VIOLATES spec requiring memory/session storage)
- [x] T028 Update API client wrapper to prefer Bearer for Node API and maintain HighLevel headers where required in `/Users/schott/Projects/racc-membership-app/src/services/apiClient.ts`
  **STATUS: COMPLETED** - apiFetch wrapper exists with HighLevel headers
- [ ] T029 Implement Nomination form and submission handling in `/Users/schott/Projects/racc-membership-app/src/pages/Nominations.tsx`
  **STATUS: PARTIAL** - Page exists but shows member list instead of nomination form per spec
- [x] T030 Implement Members browse and Member details views in `/Users/schott/Projects/racc-membership-app/src/pages/Members.tsx` and `/Users/schott/Projects/racc-membership-app/src/pages/MemberDetails.tsx`
  **STATUS: COMPLETED** - Both pages exist with browse/search and detail navigation
- [ ] T031 Implement Calendar page with CRUD UI and permission checks in `/Users/schott/Projects/racc-membership-app/src/pages/Calendar.tsx`
  **STATUS: STUB** - Page exists but only shows title (no CRUD functionality)
- [ ] T032 Implement Discussions moderation affordances (report/hide/remove visibility) in `/Users/schott/Projects/racc-membership-app/src/pages/Discussions.tsx`
  **STATUS: STUB** - Page exists but only shows title (no moderation functionality)

## Phase 3.4: Integration
- [ ] T033 Add auth middleware in backend (`/Users/schott/Projects/racc-membership-app/ghl-api/src/middleware/auth.js`) to validate session and roles
  **STATUS: NOT STARTED** - No middleware directory exists
- [ ] T034 Add request/response logging and error handling (`/Users/schott/Projects/racc-membership-app/ghl-api/src/middleware/logging.js`, `/Users/schott/Projects/racc-membership-app/ghl-api/src/middleware/errors.js`)
  **STATUS: PARTIAL** - Basic error handler exists in app.js, needs middleware files
- [x] T035 Enable CORS and security headers for API (`/Users/schott/Projects/racc-membership-app/ghl-api/src/app.js`)
  **STATUS: COMPLETED** - CORS enabled in app.js
- [ ] T036 Wire Swagger UI to serve OpenAPI at `/api/docs` (`/Users/schott/Projects/racc-membership-app/ghl-api/src/app.js`)
  **STATUS: PARTIAL** - Swagger setup commented out in app.js

## Phase 3.5: Polish
- [ ] T037 [P] Frontend unit tests (forms, stores, components) under `/Users/schott/Projects/racc-membership-app/src/tests/unit/*`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T038 [P] Backend unit tests for policies and services under `/Users/schott/Projects/racc-membership-app/ghl-api/tests/unit/*`
  **STATUS: NOT STARTED** - No tests directory exists
- [ ] T039 Performance checks: calendar ops <200ms p95, API list <300ms p95 (document methodology)
  **STATUS: NOT STARTED**
- [ ] T040 [P] Update docs: add `README` sections for auth flow and API usage; link OpenAPI docs
  **STATUS: PARTIAL** - README exists with basic setup, needs auth flow and API sections
- [ ] T041 Remove duplication and dead code (document changes)
  **STATUS: NOT STARTED**
- [ ] T042 Run manual quickstart validation from `/specs/001-a-membership-portal/quickstart.md`
  **STATUS: NOT STARTED**

## Dependencies
- T001 precedes all backend tests and implementation
- T004–T008 must fail before T015–T026
- T014 (models) precedes services (T015–T021)
- Services precede endpoints (T022–T026)
- Backend middleware (T033–T036) follows route wiring
- Frontend auth/client (T027–T028) precedes page flows (T029–T032)
- Polish (T037–T042) runs after core implementation

## Parallel Execution Examples
```
# Run contract tests in parallel after setup:
Task: T004, T005, T006, T007, T008

# Run frontend integration tests in parallel:
Task: T009, T010, T011, T012, T013

# Implement independent models/services in parallel:
Task: T014 [models], T016 [nominations], T017 [members]
```

## Validation Checklist
- [ ] All contracts have corresponding tests (T004–T008)
- [ ] All entities have model tasks (T014)
- [ ] Tests come before implementation across areas
- [ ] [P] tasks modify different files
- [ ] Each task specifies absolute file paths
- [ ] Dependencies are explicit and ordered
