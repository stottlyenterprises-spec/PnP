# D.E.E.D.S. Mobile

Progress, Not Perfection

D.E.E.D.S. uses Capacitor to share the existing product across iOS, Android, and the web.

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

The initial shell loads `https://p-n-p.vercel.app`. OAuth connections therefore continue to use the deployed D.E.E.D.S. callback URLs while the native bridge is developed.

## Current status

- Shared app identity and native configuration: ready
- Responsive viewport and safe areas: ready
- Hosted real-device shell: ready to generate
- Native recurring check-in notifications and notification routing: ready to sync
- Deep-link routing for views and voice-created tasks: ready to sync
- Haptic feedback for completed tasks: ready to sync
- Native project folders: generated locally after dependencies are installed
- Remote push notifications, Siri/App Actions, HealthKit, Health Connect, biometric lock, and offline queue: planned

See `docs/MOBILE_ROADMAP.md` for release gates and implementation order.
