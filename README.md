<div align="center">
  <img src="mobile-app/assets/icon.png" alt="Coin Odyssey Logo" width="120"/>
  <h1>Coin Odyssey</h1>
  <p>Scan, identify, and track your coin collection. AI-powered coin recognition, grading, and value estimates on iOS and Android.</p>
</div>

## Overview

Coin Odyssey is a mobile-first coin collection manager for numismatists. Point your camera at a coin and the scan pipeline identifies it, estimates its grade and market value, and catalogs it to your collection — with offline support and realtime sync across devices.

**v1.0 targets the mobile app.** The legacy desktop (Electron) app has been retired; the web app is kept in-repo for its legal pages but is not part of the release.

## Project Structure

```
coin-collecting-app/
├── mobile-app/          Expo / React Native app (the product)
├── packages/shared/     Shared TypeScript types & reference data
├── supabase/            Database migrations & edge functions
├── web-app/             Next.js app (retired; hosts privacy/terms pages)
└── docs/                Documentation & compliance guides
```

| Component | Stack | Backend |
|-----------|-------|---------|
| **Mobile** | Expo SDK 54 / React Native 0.81 | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| **Recognition** | `recognize-coin` edge function | Claude vision API |

## Development

```bash
# From the repo root (npm workspaces)
npm install

# Run the mobile app
cd mobile-app
npx expo start

# Checks (also run in CI)
npm run typecheck:mobile
npm run test:mobile
```

Copy `mobile-app/.env.example` to `mobile-app/.env` and fill in the Supabase URL and anon key before running.

## Features

- **Scan pipeline** — camera capture → AI identification → grade estimate (Sheldon scale) → market value estimate → catalog
- **Collection management** — filtering, sorting, photos, coin details
- **Offline-first** — writes queue while offline and auto-sync on reconnect
- **Realtime sync** — changes appear across devices via Supabase Realtime
- **Auth** — email/password and Sign in with Apple; in-app password reset; account deletion
- **Crash reporting** — Sentry (enabled via `EXPO_PUBLIC_SENTRY_DSN`)
