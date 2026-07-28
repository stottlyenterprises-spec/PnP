# PNP Mobile

PNP uses Capacitor to share the existing product across iOS, Android, and the web.

## First-time setup

From the repository root:

```bash
pnpm install
pnpm mobile:add:ios
pnpm mobile:add:android
pnpm mobile:sync
```

Then open the native project:

```bash
pnpm mobile:ios
pnpm mobile:android
```

The initial shell loads `https://p-n-p.vercel.app`. OAuth connections therefore continue to use the deployed PNP callback URLs while the native bridge is developed.

## Current status

- Shared app identity and native configuration: ready
- Responsive viewport and safe areas: ready
- Hosted real-device shell: ready to generate
- Native project folders: generated locally after dependencies are installed
- Push notifications, deep links, Siri/App Actions, HealthKit, Health Connect, biometric lock, and offline queue: planned

See `docs/MOBILE_ROADMAP.md` for release gates and implementation order.
