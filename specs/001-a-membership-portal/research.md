# Research Summary

Date: 2025-09-16

## Decisions
- Sessions: Use Authorization Code with PKCE, storing tokens in memory (sessionStorage fallback). Enforce state/nonce and S256.
- GHL Integration: Use Node/Express API with `@gohighlevel/api-client` and PIT for upstream calls; document with Swagger.
- Calendar Concurrency: Last-write-wins with version check; show conflict message when detected.
- Content Limits: Configurable per-member limits for news, events, job listings; enforce at API.
- Moderation: Members can report; admins/content managers can hide/remove/restore; log actions; notify authors.

## Rationale
- PKCE offers secure session handling in web/mobile contexts without sharing secrets in the client.
- Wrapping GHL with a server API centralizes auth and policy enforcement.
- Simple concurrency control covers typical calendar edits with clear UX on conflicts.
- Explicit limits prevent spam and maintain quality.
- Clear moderation flow improves safety and accountability.

## Alternatives Considered
- Implicit flow (rejected: less secure post-OAuth 2.1 guidance).
- Client-direct GHL calls (rejected: PIT secrecy and policy enforcement).
- Full optimistic locking for all resources (deferred: complexity vs. benefit).
- Unbounded content creation (rejected: risk of abuse).
