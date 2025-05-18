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

## How to install

1. Clone this repository:

```bash
git clone https://github.com/openskysolutions/react-vite-shadcn.git
```

2. Go into project

```bash
cd react-vite-shadcn
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
