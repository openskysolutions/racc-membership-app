# RACC Membership App Constitution

## Core Principles

### I. Security & Privacy First
- Authentication uses OAuth 2.1/OIDC Authorization Code with PKCE via Better Auth ("Better Auth PKCE").
- Enforce state and nonce, S256 code challenge, HTTPS-only redirects.
- Access tokens are ephemeral and held in memory (or sessionStorage as a fallback). Never persist long-lived tokens in localStorage.
- Apply least-privilege scopes, rotate/refresh securely, and avoid exposing secrets in the frontend.

### II. Typed, Component-Driven Frontend
- React 18 + TypeScript with Vite bundling/build.
- UI built with Tailwind CSS, shadcn/ui, and Radix primitives; icons via lucide-react/react-icons.
- Routing via react-router-dom with file-based routes using vite-plugin-pages.
- State management via Zustand; shared utilities in `src/lib` with path alias `@` → `src`.

### III. Multi-Target Delivery, One Codebase
- Primary target is the Web; mobile builds via Capacitor (iOS/Android) using `dist` as `webDir`.
- Desktop distribution via Electron (main process in `electron-main.cjs`, preload in `preload.cjs`) and packaged with electron-builder.
- Keep platform-specific code thin; maximize shared logic/components.

### IV. Integration Contracts
- External services: LeadConnector/GoHighLevel. For HighLevel APIs, the client adds headers (`token-id`, `source`, `channel`) via a fetch wrapper.
- A dedicated integration service lives in `ghl-api/` (Express 5), using `@gohighlevel/api-client`, Axios, and Swagger docs.
- For OIDC-protected resources, use Authorization: Bearer headers from Better Auth; for HighLevel endpoints, continue required header scheme.

### V. Observability & Quality Gates
- Frontend: type-checking, ESLint, and preview builds must pass before merge.
- Backend: structured logs, health endpoints, and OpenAPI (swagger) kept in sync.
- Add smoke tests for critical flows (auth login/redirect, initial data fetch, navigation).

### VI. Versioning & Breaking Changes
- Use SemVer for app and integration service.
- Breaking changes require a migration note and coordinated rollout across Web, Electron, and Capacitor builds.

### VII. Simplicity & DX
- Prefer simple, well-supported libraries. Avoid speculative abstractions.
- Document small, composable modules; copy-paste before introducing cross-cutting frameworks.

## Technology Stack and Security Requirements

### Frontend (Web)
- React 18 + TypeScript 5, Vite 5
- Routing: react-router-dom 7, vite-plugin-pages (scans `src/pages`)
- UI: Tailwind CSS 3.4, shadcn/ui, Radix UI, tailwindcss-animate
- State: Zustand 5; utilities: classnames/clsx/cva/tailwind-merge
- Assets/DX: SVGR, `@` alias to `src`, ESLint with typescript-eslint

### Runtime Targets
- Desktop: Electron 24 with electron-builder (mac dmg/zip, win nsis, linux AppImage)
- Mobile: Capacitor 7 (iOS/Android), safe area plugin

### Networking & APIs
- Dev proxy: Vite routes `/api` → `https://services.leadconnectorhq.com`.
- Client fetch wrapper injects HighLevel-required headers. Keep wrapper side-effect free and testable.
- Integration service (`ghl-api/`): Express 5, Axios, `@gohighlevel/api-client`, Swagger.

### Authentication (Better Auth PKCE)
- OAuth 2.1/OIDC Authorization Code with PKCE using Better Auth.
- Code flow: generate `code_verifier` and S256 `code_challenge`; include `state` and `nonce` in authorization request; handle redirect and token exchange.
- Storage: tokens in memory; `code_verifier`, `state`, `nonce` in sessionStorage with short TTL; avoid localStorage for tokens.
- Headers: use `Authorization: Bearer <access_token>` for OIDC-protected resources. Maintain HighLevel header scheme (`token-id`, `source`, `channel`) where required.
- Errors: handle consent/cancel, invalid_grant, token expiry/refresh, clock skew; provide user-safe messaging and retry guidance.

## Development Workflow & Quality Gates

- All PRs must assert Constitution compliance in the description.
- Required checks: type-check, ESLint, Vite build (web), Electron dev launch smoke, Capacitor sync integrity when platform changes.
- Auth changes require: threat model note, redirect URI review, storage review, and local/manual flow verification.
- API changes: update Swagger in `ghl-api/`, add/adjust client types and service methods, and validate through the dev proxy.

## Governance

- This Constitution supersedes ad-hoc practices. Exceptions must be documented in the PR with a rollback plan.
- Amendments require: version bump, change log entry, and checklist run from `constitution_update_checklist.md`.
- Any change affecting authentication or user data requires an explicit security review note.

**Version**: 2.2.0 | **Ratified**: 2025-09-16 | **Last Amended**: 2025-09-16