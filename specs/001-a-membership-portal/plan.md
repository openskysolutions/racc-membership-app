# Implementation Plan: Membership Portal & Marketing Site

**Branch**: `001-a-membership-portal` | **Date**: 2025-09-16 | **Spec**: /Users/schott/Projects/racc-membership-app/specs/001-a-membership-portal/spec.md
**Input**: Feature specification from `/specs/001-a-membership-portal/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → No remaining ambiguities in spec
   → Detect Project Type: web + backend + mobile packaging
   → Structure Decision: Option 2 (Web application: frontend + backend)
3. Fill the Constitution Check section based on the constitution document
4. Evaluate Constitution Check section below
   → No violations; Initial Constitution Check: PASS
5. Execute Phase 0 → research.md
   → Completed
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → Completed
7. Re-evaluate Constitution Check section
   → No violations; Post-Design Constitution Check: PASS
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → Completed
9. STOP - Ready for /tasks command
```

## Summary
Build and ship a public marketing site and a secure member portal that runs on the web and is packaged for mobile. Integrate with GoHighLevel/LeadConnector via a Node/Express API, using a Private Integration Token (PIT) for upstream calls. Use Better Auth PKCE to establish secure sessions between the frontend and the Node API. Deliver core features: nominations, member directory and profiles, discussions with moderation, courses, leaderboard, news/events/job listings, and an interactive calendar with CRUD and permissioned management. Success is measured by complete user flows, enforced permissions and limits, and stable session handling across platforms.

## Technical Context
**Language/Version**: TypeScript 5 (frontend), Node.js LTS for backend (Express 5)
**Primary Dependencies**: React 18, Vite 5, Tailwind 3.4, shadcn/ui, Radix UI, Zustand 5, vite-plugin-pages, SVGR; Express 5, Axios, `@gohighlevel/api-client`, Swagger
**Storage**: No dedicated app DB specified; primary data via GoHighLevel/LeadConnector; session tokens ephemeral (in-memory/session scope); content limits stored as policy in API (backed by provider or config)
**Testing**: Planned: Frontend unit/integration with Vitest + Testing Library; Backend contract/integration tests with Jest or Vitest + supertest; smoke tests for auth and navigation
**Target Platform**: Web SPA; Mobile via Capacitor (iOS/Android); Desktop via Electron for parity (dev/test only as needed)
**Project Type**: Web + Backend (+ Mobile packaging)
**Performance Goals**: SPA initial route TTI < 3s on mid-tier devices; interactive calendar operations < 200ms p95 locally; API response < 300ms p95 for cached/list endpoints
**Constraints**: Secure sessions with PKCE; no long-lived tokens in localStorage; comply with HighLevel header requirements where applicable; maintain OpenAPI docs for API
**Scale/Scope**: Target thousands of members; dozens of concurrent users; calendar with hundreds of events; moderate content volumes

## Constitution Check
Security & Privacy
- Better Auth PKCE for sessions; state/nonce and S256 enforced; tokens in memory/session scope only (no localStorage). Compliant.
- For HighLevel endpoints, continue `token-id`, `source`, `channel` headers where required. Compliant.

Typed, Component-Driven Frontend
- React + TS, Tailwind, shadcn/ui, Radix, Zustand, vite-plugin-pages. Compliant.

Multi-Target Delivery
- Web primary; Capacitor mobile; Electron optional. Shared logic emphasized. Compliant.

Integration Contracts
- Node/Express API with Swagger; upstream via GHL client + PIT. Compliant.

Observability & Quality Gates
- Type-check, ESLint, preview builds; backend logs and swagger; smoke tests for auth/initial data. Compliant.

Versioning & Simplicity
- SemVer; minimal libraries; avoid speculative abstractions. Compliant.

Gate Status: Initial Constitution Check: PASS | Post-Design Constitution Check: PASS

## Project Structure

### Documentation (this feature)
```
specs/001-a-membership-portal/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Actual current structure
frontend (SPA): /src
backend (API): /ghl-api
mobile packaging: Capacitor (root)
desktop packaging: Electron (root)
```

**Structure Decision**: Option 2 (Web application: frontend + backend). Keep existing repo layout (frontend at root, backend in `ghl-api/`).

## Phase 0: Outline & Research
See `/specs/001-a-membership-portal/research.md` for decisions on PKCE session handling, GHL integration via PIT, calendar concurrency, content limit policy, and moderation policy.

## Phase 1: Design & Contracts
Outputs created:
- Data Model: `/specs/001-a-membership-portal/data-model.md`
- API Contracts (OpenAPI): `/specs/001-a-membership-portal/contracts/openapi.yaml`
- Quickstart: `/specs/001-a-membership-portal/quickstart.md`

## Phase 2: Task Planning Approach
Task Generation Strategy:
- Load the tasks template
- Generate tasks from OpenAPI contracts (each endpoint → contract test task), entities (model tasks), and user stories (integration test tasks)
- Implementation tasks follow to make tests pass

Ordering Strategy:
- TDD order: tests before implementation
- Dependency order: models → services → UI
- Mark [P] for parallelizable tasks

Estimated Output: 25–30 tasks in tasks.md (created by /tasks)

## Complexity Tracking
No deviations from Constitution.

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.2.0 - See `/.specify/memory/constitution.md`*


# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
