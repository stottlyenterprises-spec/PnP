# Progress, Not Perfection: iOS and Android Roadmap

## Product direction

PNP will remain one product across the web, iPhone, iPad, and Android. The Next.js app continues to own the interface and server integrations. Capacitor provides native iOS and Android containers plus access to device capabilities.

The first native build intentionally points at the production PNP application. This makes it possible to validate navigation, authentication, safe areas, keyboard behavior, and real-device usability before maintaining packaged web assets. It is a development milestone, not the App Store submission architecture.

## Phase 1: Native shell

- Capacitor 8 configuration for iOS and Android
- PNP production environment loaded over HTTPS
- Mobile viewport and safe-area support
- Stable app identity: `com.stottly.progressnotperfection`
- Native project generation through the package scripts
- Real-device testing on iPhone and Android

### Generate the native projects

Install dependencies, then run:

```bash
pnpm mobile:add:ios
pnpm mobile:add:android
pnpm mobile:sync
```

Open the projects:

```bash
pnpm mobile:ios
pnpm mobile:android
```

Xcode is required for iOS. Android Studio and the Android SDK are required for Android.

## Phase 2: Native value

These features move PNP beyond a repackaged website and should be complete before App Store submission:

1. Native local and push notifications with deep links into D.E.E.D.S., interviews, relationship check-ins, and weekly review.
2. Siri/App Intents and Android App Actions for “create a task,” “open D.E.E.D.S.,” and “start my check-in.”
3. Native share target so text, links, and selected content can be sent into Tasks, Quick Notes, or Journal.
4. Haptic feedback for task completion and important actions.
5. Biometric lock for health, journal, relationship, and connected-account data.
6. Offline capture queue for tasks, interviews, health check-ins, and journal entries.

## Phase 3: Health integration

- iOS: HealthKit with explicit, granular permission requests
- Android: Health Connect with equivalent permissions
- Supported first: sleep duration, weight, steps/activity, heart rate, and workouts
- Oura remains a connected source and is reconciled rather than blindly duplicated
- Every imported value keeps its source and timestamp
- Users can override imported values without destroying the original record

Health integrations require privacy disclosures, permission explanations, data deletion controls, and a written retention policy before public release.

## Phase 4: Accounts and synchronization

The current Google-backed save is useful for personal testing, but a public product needs a provider-neutral account and sync layer:

- PNP account with Apple, Google, or email sign-in
- Encrypted user data separated by account
- Deterministic conflict resolution between web and mobile changes
- Background sync with visible last-sync status
- Export, import, and full account deletion
- Multiple Gmail accounts remain separate connected services, not the user's PNP identity

## Phase 5: Store readiness

- Replace the hosted development shell with packaged web assets plus remote APIs
- Production app icons and splash assets for every required size
- Universal Links and Android App Links
- Notification certificates and Firebase configuration
- Privacy manifests, privacy policy, support URL, and store disclosures
- Accessibility, dynamic type, screen reader, keyboard, and reduced-motion testing
- TestFlight and Play internal testing
- Crash reporting with no journal or health content in logs

## Release gates

PNP is ready for store review only when:

- core capture and check-in flows work offline
- sync is reliable across at least two devices
- native notifications deep-link correctly
- health permissions are understandable and optional
- account deletion and data export work
- the app provides meaningful native utility beyond its website

## Immediate next build

The next implementation slice should generate both native projects and add the native bridge for deep links, notification routing, and voice-created tasks. That bridge becomes the common entry point for Siri, Android voice actions, notification taps, and shared content.
