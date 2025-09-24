# Shadcn/UI Landing Page Template

## <a href="https://react.dev/" target="_blank">React</a> + <a href="https://vite.dev/">Vite</a> + <a href="https://ui.shadcn.com/" target="_blank">ShadcnUI</a> + <a href="https://www.typescriptlang.org/" target="_blank">TypeScript</a> + <a href="https://tailwindcss.com/" target="_blank">Tailwind</a>.


## Sections

- [x] Navbar
- [x] Sidebar(mobile)
- [x] Hero
- [x] Footer

## Features

- [x] Fully Responsive Design
- [x] User Friendly Navigation
- [x] Dark Mode
- [x] Meta tags

## Tech Stack

- Frontend: React 18, Vite 5, TypeScript 5
- UI: Tailwind CSS 3.4, shadcn/ui, Radix UI, tailwindcss-animate
- Routing: react-router-dom 7 + vite-plugin-pages (file-based routes in `src/pages`)
- State: Zustand 5
- Assets/DX: SVGR, path alias `@` → `src`
- Desktop: Electron 24 with electron-builder
- Mobile: Capacitor 7 (iOS/Android), capacitor-plugin-safe-area
- Integration service: Node/Express 5 in `ghl-api/` with `@gohighlevel/api-client`, Axios, Swagger
- Auth: Better Auth PKCE (OAuth 2.1/OIDC Authorization Code with PKCE). See “Authentication” below and the Constitution
	(`.specify/memory/constitution.md`).

## How to install

1. Clone this repository:

```bash
git clone https://github.com/openskysolutions/racc-membership-app.git
```

2. Go into project

```bash
cd racc-membership-app
```

3. Install dependencies

```bash
npm install
```

4. Run project

```bash
npm run dev
```

## Mobile (Capacitor)

1. Build web assets:
```bash
npm run build
```
2. Initialize Capacitor (only once):
```bash
npm run cap:init
```
3. Add platforms:
```bash
npm run cap:add:ios
npm run cap:add:android
```
4. Sync web assets to native projects:
```bash
npm run cap:sync
```
5. Open native IDE:
```bash
npm run cap:open:ios
npm run cap:open:android
```

## Desktop (Electron)

- Run in development (launch Vite and Electron):
```bash
npm run electron:dev
```
- Build production package:
```bash
npm run build
```bash
npm run electron:build
```

## Authentication (Better Auth PKCE)

- Uses OAuth 2.1/OIDC Authorization Code flow with PKCE.
- Generates `code_verifier` and S256 `code_challenge`, includes `state`/`nonce`, and exchanges the authorization code for tokens.
- Access tokens are held in memory (or sessionStorage as a fallback). Do not persist long-lived tokens in localStorage.
- For OIDC-protected APIs, send `Authorization: Bearer <access_token>`.
- For HighLevel endpoints, continue using `token-id`, `source`, and `channel` headers as required by the API.

