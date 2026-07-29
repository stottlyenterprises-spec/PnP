# D.E.E.D.S.: iOS and Android Roadmap

Progress, Not Perfection

## Product direction

D.E.E.D.S. will remain one product across the web, iPhone, iPad, and Android. The Next.js app continues to own the interface and server integrations. Capacitor provides native iOS and Android containers plus access to device capabilities.

The first native build intentionally points at the production D.E.E.D.S. application. This makes it possible to validate navigation, authentication, safe areas, keyboard behavior, and real-device usability before maintaining packaged web assets. It is a development milestone, not the App Store submission architecture.

## Phase 1: Native shell

- Capacitor 8 configuration for iOS and Android
- D.E.E.D.S. production environment loaded over HTTPS
- Mobile viewport and safe-area support
- Stable app identity: `com.stottly.deeds`
- Native iOS and Android projects generated and synchronized
- Android compile and target SDK set to API 36
- iOS deployment target set to iOS 15
- App, Haptics, and Local Notifications plugins registered on both platforms
- Real-device testing on iPhone and Android

### Current native project status

The native projects now live in `ios/` and `android/`. Do not run the
`mobile:add` commands again. After installing dependencies or changing a
Capacitor plugin or configuration, synchronize both projects with:

```bash
pnpm mobile:sync
```

Open the projects:

```bash
pnpm mobile:ios
pnpm mobile:android
```

Xcode is required for iOS. Android Studio and the Android SDK are required for Android.

### One-time local validation

1. Open `ios/App/App.xcodeproj` in Xcode, select the App target, choose the
   Stottly Enterprises development team, and run on an iPhone or simulator.
2. Open the `android/` directory in Android Studio. Confirm that Android SDK
   Platform 36, Build Tools, Platform Tools, and Command-line Tools are
   installed, then run the debug build on an emulator or connected device.
3. Confirm the hosted production app loads, safe areas are correct, external
   account authentication returns to D.E.E.D.S., haptics fire, and local
   notification permission can be granted.
4. Test notification routing from a cold launch and a background launch.

The web production build and TypeScript validation passed before the native
projects were generated. Command-line iOS compilation inside Codex is blocked
by Apple's nested build sandbox, so the first native compile must be completed
from Xcode. Android Studio is installed, but its SDK components must be present
before the first Android compile.

## Phase 2: Native value

These features move D.E.E.D.S. beyond a repackaged website and should be complete before App Store submission:

1. Native local notifications with deep links into D.E.E.D.S., interviews, and weekly review. The bridge is implemented and ready for real-device validation. Remote push remains a later server-backed step.
2. Siri/App Intents and Android App Actions for “create a task,” “open D.E.E.D.S.,” and “start my check-in.”
3. Share target so text, links, and selected content can be sent into Tasks, Notes, or Journal. The shared capture contract and installable-app target are implemented; native share extensions remain to be registered after project generation.
4. Haptic feedback for task completion and important actions.
5. Biometric lock for health, journal, relationship, and connected-account data.
6. Offline capture queue for tasks, interviews, health check-ins, and journal entries.

### Native capture contract

Both native apps register the `deeds://open` route. Supported examples:

- `deeds://open?view=tasks`
- `deeds://open?view=home&period=breakfast`
- `deeds://open?voiceTask=Call%20the%20contractor`
- `deeds://open?share=1&capture=Task&text=Review%20this%20article`

Inbound task text always opens the existing editable capture overlay before it
is saved. Android also registers as a `text/plain` share target and routes
shared titles, text, and links into that same overlay. The Android handler
clears the consumed intent so rotating or resuming the app cannot import the
same item twice.

The custom scheme is the development and fallback route. Production Siri
App Intents and verified web links will use Universal Links after the Apple
Team ID is added to the site association file and Associated Domains
entitlement. Android App Links will be verified after release signing
certificates are available.

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

- D.E.E.D.S. account with Apple, Google, or email sign-in
- Encrypted user data separated by account
- Deterministic conflict resolution between web and mobile changes
- Background sync with visible last-sync status
- Export, import, and full account deletion
- Multiple Gmail accounts remain separate connected services, not the user's D.E.E.D.S. identity

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

D.E.E.D.S. is ready for store review only when:

- core capture and check-in flows work offline
- sync is reliable across at least two devices
- native notifications deep-link correctly
- health permissions are understandable and optional
- account deletion and data export work
- the app provides meaningful native utility beyond its website

## Phase 6: Optional task packs

After the native applications, account system, synchronization, and store-readiness gates are complete, D.E.E.D.S. can add optional pre-grouped task packs.

The first implementation will validate free, fully editable packs before introducing Apple or Google one-time purchases. Pack installations must remain separate from personal data, preserve user changes during updates, prevent duplicates, and restore ownership across devices.

See [D.E.E.D.S. Task Packs Plan](./TASK_PACKS_PLAN.md) for the catalog, installation experience, technical model, monetization sequence, and release gates.

## Immediate next build

Validate the generated projects on one iPhone and one Android device. Then
register Siri App Intents, Android App Actions, native share extensions, and
the first HealthKit and Health Connect adapters.
