# Android native verification

## Build and isolation

- Final upgraded dependency installation was complete before this build started.
- Built the generated Android project with Temurin 17.0.20.1, matching the repository's Android CI Java major version. JDK 25 had failed during three CMake configuration tasks with restricted JNI warnings; JDK 17 passed those tasks without modifying dependency sources.
- Command: `ANDROID_HOME=/Users/diygod/Library/Android/sdk JAVA_HOME=/tmp/folo-deps-jdk17/Contents/Home PROFILE=e2e-ios-simulator EXPO_PUBLIC_E2E_ENV_PROFILE=local EXPO_PUBLIC_E2E_LANGUAGE=en ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a -x lint -x test --no-daemon --max-workers=4`.
- Release build passed in 5 minutes 38 seconds: 1,782 tasks, 1,744 executed and 38 up-to-date. Build log: `/tmp/folo-deps-android-build-jdk17.log`.
- Installed the resulting 73,488,326-byte APK on a dedicated API 36 arm64 emulator, `emulator-5580`. Inspected its bundled `assets/app.config`: E2E profile `local`, language `en`.
- The task AVD uses `/tmp/folo-deps-android-avd/FoloDependencyReview.avd`, created from device configuration only with fresh task data. The user's existing AVD and connected physical Pixel were not modified.
- `adb reverse tcp:3000 tcp:3000` connects the app's localhost API URL to the disposable test backend. The emulator's TCP proxy rejects external destinations; this prevents Firebase/Google background requests from reaching external services. This isolation limits external image, attestation, push and billing verification and is not evidence of their success.

## Test data

After the final backend test suite finished (so no later truncate could remove fixtures), invoked the application's real `refreshOnboardingFeedRecords()` under committed `.env.test` with an additional localhost:5433 URL guard. No schema or production record was changed.

- Feed: `1300310806025338880`, `folo://onboarding`, `Welcome to Folo`.
- Entries: `1300310806075670528`, `1300310806075670529`, `1300310806075670530`.
- Seed evidence: `/tmp/folo-deps-onboarding-seed.log`.

## Runtime validation

The real Release app displayed the email, Google and GitHub signup options and registered a task-only account against the local backend. No AndroidRuntime fatal exception or ReactNativeJS error was present in the startup check.

The first auth journey exposed two real defects. First, the screen registration effect appended metadata after sibling screens whenever it ran again, while the tab bar navigated by metadata array position. The visible order became Subscriptions, Discover, Settings, Home although the screen indices remained Home, Subscriptions, Discover, Settings. Labels, selection and destination indices could disagree. Evidence: `/tmp/folo-deps-android-maestro-auth.log`, `/tmp/folo-deps-android-auth-progress.png`, `/tmp/folo-deps-android-auth-failure.xml`.

`TabScreen.tsx` now replaces registrations by their stable screen index and sorts the metadata by that index. `Tabbar.tsx` uses the route's actual screen index for both navigation and focus. Mobile typecheck passed; lint reported no errors in these files (the two existing `any` warnings remain). The fixed release rebuilt successfully in 1 minute 20 seconds, with 26 tasks executed and 1,756 reused: `/tmp/folo-deps-android-build-navfix.log`.

Added `e2e/flows/android/tab-navigation.yaml` to the normal Android auth journey. It switches Settings, Subscriptions, Discover and Home three times, asserting each screen's own control or content, then cold-starts the app and checks the persisted session and correct Settings/Home mapping. Final flow results and content checks are recorded below after execution.

The second auth run showed the correct tab order, but the Settings assertion still failed because **all** main-screen touch handlers stopped responding after signup. A cold restart with the same stored session immediately restored interaction, narrowing the fault to state left behind after signup. The Android success toast mounts `ToastContainer` through a persistent root sibling. Its two full-screen views used `pointerEvents="box-only"`, and clearing the toast stack left those invisible views mounted and intercepting touches. `ToastContainer.tsx` now returns `null` for an empty stack and uses `box-none` for layout containers so background touches can pass through while a toast is visible. This conclusion is Android-specific: iOS success toasts use the native Toaster module.

The navigation regression passed after cold restart on the same persisted account: all three cycles, session restoration, and the final Settings/Home assertions. Log: `/tmp/folo-deps-android-maestro-navigation.log`. The toast fix passed mobile typecheck and lint, and the final release rebuilt successfully in 1 minute 54 seconds: `/tmp/folo-deps-android-build-toastfix.log`.

Added `e2e/flows/android/content.yaml` to the auth journey to reuse the existing subscription and reader flows. The complete sequence now covers signup, logout, password login, repeated tab navigation, cold-start session persistence, removing the onboarding subscription, discovering and following it again, opening an article, long-press read/unread toggles, and unfollowing it.

With the toast fix, signup, immediate Settings navigation, logout and password login all passed in one uninterrupted run. The stronger tab regression then exposed a third issue: after password login, the dismissed modal left the soft keyboard visible over the bottom tabs. `EmailLogin` and `EmailSignUp` now explicitly dismiss the keyboard and clear its focus when submitting. This is an app behavior fix, rather than a test that hides the keyboard to bypass the problem.

The reader flow now selects the first entry by test ID instead of a fixed screen coordinate, waits for actual WebView body text, and scrolls to the `Your Subscriptions` section before returning to the timeline and testing read/unread actions. Thus a blank or broken article renderer cannot pass merely because the timeline disappears.

The subscription preflight successfully removed the real subscription, opened Discover and submitted a URL. Android's default text-input capitalization changed `folo://onboarding` into `Folo://onboarding`, causing the follow lookup to fail. Discover's search field now disables automatic capitalization and correction so URL text is preserved. The resulting error also exposed raw request context appended by the API SDK; `FollowUrl` now uses the existing `sanitizeErrorMessage` helper before displaying the error, keeping request headers out of this screen.

Verified renderer freshness separately from the React Native bundle: rebuilding `apps/mobile/web-app` against final dependencies into an isolated temporary directory produced `index-cc0j7Wei.js` and `index-BWpPiY9n.css`, identical to the final workspace `out/rn-web/html-renderer/index.html`. Android's generated assets still referenced an earlier renderer copied during prebuild. Replaced only that generated `html-renderer` directory with the final build before the final APK build. Renderer build log: `/tmp/folo-deps-android-renderer-build.log`.

A later uninterrupted auth run reproduced an Android native presentation race after sign-out reload: the Login route existed in the JS navigation stack (`Top of stack is already LoginScreen`), but no native modal was visible. Removing that invisible route with Android Back and reopening it made the modal appear, establishing a native-mount timing problem rather than an API or disabled-button failure. `RootStackNavigation` now waits for the root native screen's `onAppear` before rendering queued routes on Android. `WrappedScreenItem` composes that notification into its existing focus/lifecycle handler; queued route state is retained. The initial fix was Android-only; a later iOS A/B demonstrated an analogous startup ordering failure and extended this readiness gate to both platforms, as recorded in the iOS report. The Android registration flow now asserts the automatic anonymous login modal before any manual open-auth action; sign-out similarly requires its automatic login modal without a recovery tap.

Actual article inspection also found a pre-existing mobile reader gap: onboarding content is stored as Markdown and the desktop reader explicitly selects a Markdown renderer, but the mobile WebView parsed it as HTML and displayed literal `###` and `**`. The WebView now converts only onboarding entry content with the existing shared Markdown parser, then passes its HTML through the normal sanitizer and custom media/link renderer. Added actual render tests for headings/emphasis/native image wrappers, media hiding, unsafe URL filtering, and preservation of ordinary HTML articles. The two renderer test files pass all 12 tests with `pnpm exec vitest run --config vite.config.mts --environment happy-dom src/App.test.tsx src/spotlight.test.tsx` from `apps/mobile/web-app/html-renderer`; log `/tmp/folo-deps-android-markdown-tests.log`. These defects were found during dependency E2E; the Markdown, toast and capitalization mistakes existed in application code before the upgrade and are not all attributed to upstream changes.

The final Markdown-enabled WebView production build contains `index-DZ2Ze5om.js` and `index-DmJdjm9r.css`. Android's generated bundled resources were refreshed from this output; the iOS owner was given the same asset names. Mobile and WebView typechecks passed; lint on the navigation and reader changes has no errors (four pre-existing warnings). Logs: `/tmp/folo-deps-android-nativegate-typecheck.log`, `/tmp/folo-deps-android-markdown-typecheck.log`, `/tmp/folo-deps-android-nativegate-lint.log`, `/tmp/folo-deps-android-markdown-renderer-build.log`.

## Completed continuous journey

After the final pnpm 12 frozen installation, rebuilt the Android release with the navigation gate and Markdown reader: **PASS in 3 minutes 23 seconds**, 1,782 tasks (1,500 executed, 282 reused). Verified `assets/html-renderer/index.html` inside the resulting APK references `index-DZ2Ze5om.js`. Build log: `/tmp/folo-deps-android-build-nativegate.log`.

The new-account continuous journey then **passed in 4 minutes 44 seconds**, without manual Back recovery, forced restart between signup/logout/login, or bypassing assertions:

1. Automatic anonymous login presentation and real signup.
2. Immediate Settings navigation, real sign-out, automatic login presentation after JS reload, and real password login.
3. Three complete Settings/Subscriptions/Discover/Home cycles, then cold-start persisted session and correct tab destinations.
4. Unfollow, Discover by the exact onboarding URL, follow form submission and the real subscription appearing.
5. Open the first timeline entry; assert the actual introductory paragraph in the WebView and scroll to the parsed `Your Subscriptions` heading.
6. Return to the timeline, long-press and toggle read/unread with the opposite menu action asserted.
7. Unfollow and assert the subscription is gone.

Evidence: `/tmp/folo-deps-android-maestro-nativegate.log` and its matching Maestro debug directory. A subsequent Android cold-start deep-link regression is included in `android/core.yaml`; its independent execution result is recorded below.

The first independent cold-start deep-link test exposed another pre-existing startup race before navigation mounted. The screen remained on `Database Migrations...` although logs showed migration completing in 4 ms and full initialization in 271 ms. `initialize/migration.ts` mutated the same object returned by `useSyncExternalStore`, so React's snapshot identity comparison could ignore completion when the UI subscribed before migration ended. It also supported only one listener. The store now publishes a new complete `{ success, error }` snapshot and notifies a Set of subscribers; cleanup removes only its own listener. Three real React tests mount consumers before an asynchronous database completion (including two simultaneous consumers), check a consumer mounted after completion, check error propagation to the recovery UI, and ensure unmounting one subscriber does not disconnect the remaining consumer. Tests, mobile typecheck and lint pass: `/tmp/folo-deps-android-migration-tests.log`, `/tmp/folo-deps-android-migration-typecheck.log`, `/tmp/folo-deps-android-migration-lint.log`. The failed pre-fix deep-link attempt remains recorded at `/tmp/folo-deps-android-maestro-deep-link.log`; a post-fix native result is required below.

The final continuous run exposed an intermittent article tap failure that had also appeared before the final color/migration changes. A controlled A/B on the same row and coordinate reproduced it: a stationary **150 ms** touch did nothing; a **50 ms** touch immediately opened the article. `ItemPressable.tsx` set a 100 ms long-press threshold with a no-op handler. React Native's actual `Pressability.js` cancels `onPress` once that long-press handler fires, before the native context menu appears. Restored React Native's standard 500 ms threshold while retaining the no-op handler required by the [native context-menu/navigation workaround](https://github.com/nandorojo/zeego/issues/61). The iOS-specific implementation is separate and unchanged. This was a pre-existing application threshold, not a demonstrated change in RN's press-cancellation behavior. A/B screenshots: `/tmp/folo-deps-android-tap150.png`, `/tmp/folo-deps-android-tap50.png`; the latter also shows real Markdown headings and emphasis correctly rendered in the final WebView. Post-fix ordinary taps and long-press read/unread must both pass below; the failed continuous attempt is preserved in `/tmp/folo-deps-android-maestro-complete.log`.

Post-fix A/B passed on the rebuilt APK: the same stationary 150 ms touch now opens the article (`/tmp/folo-deps-android-tap150-fixed.png`), and a 650 ms long press opens the native read/unread menu without navigating or crashing (`/tmp/folo-deps-android-longpress-fixed.png`). The bundle source map was checked for the actual 500 ms threshold. Removed the Android reader's temporary tap-retry option, so the final flow must open the article with a single ordinary tap. Build `/tmp/folo-deps-android-build-press.log` passed in 1 minute 1 second (26 executed tasks, 1,756 reused); mobile typecheck, targeted lint and formatting passed.

The post-migration-fix cold-start deep-link test also passed independently: `/tmp/folo-deps-android-maestro-deep-link-fixed.log`. It stops the process, opens `folo://add?url=folo%3A%2F%2Fonboarding&type=url`, asserts the actual follow form and feed title with no login screen, dismisses the modal, and checks Settings navigation. The flow is included in the normal Android `core.yaml` journey.

## Final acceptance

The APK containing all final Android changes, including UIKit alpha compatibility, immutable migration snapshots and the 500 ms press threshold, passed the **entire continuous Android core flow in 5 minutes 58 seconds**: `/tmp/folo-deps-android-maestro-verified.log`. This includes new-account registration, logout/reload and automatic login, password login, three cycles of all four tabs, cold session restoration, follow/unfollow, a single ordinary article tap without a retry, actual Markdown paragraph/heading rendering, long-press read/unread toggles, and the cold-start follow deep link. No manual recovery was used during this run.

Then switched the dedicated emulator from light to dark appearance and exercised Settings and Discover in both modes. Search fill, secondary text, card backgrounds and separators update with the theme. Captured the real UI:

- `/tmp/folo-deps-android-settings-light.png`
- `/tmp/folo-deps-android-settings-dark.png`
- `/tmp/folo-deps-android-discover-light.png`
- `/tmp/folo-deps-android-discover-dark.png`

An independent screenshot review caught missing username/Edit text and partially drawn icons in the immediate dark-mode transition frame. A cold restart followed by Settings navigation and animation completion produced `/tmp/folo-deps-android-settings-dark-cold.png`, independently inspected with the username, Edit label, icons and separators all correctly visible. The stable light frame is `/tmp/folo-deps-android-settings-light-settled.png`. Stable cold-start visual acceptance passes; the transient theme-switch frame is retained as a limitation rather than counted as a successful render. Actual compilation of `text-white/95` produces the correct `#fffffff2`; this does not involve the upgraded UIKit `color-mix` compatibility path.

A separate pre-existing visual limitation remains: the global automatic status-bar style uses dark text in light mode even where the Settings avatar gradient is dark. This contrast issue is outside the dependency alpha fix and was not expanded into another product change. Appearance flow logs: `/tmp/folo-deps-android-colors-light.log`, `/tmp/folo-deps-android-colors-dark.log`, `/tmp/folo-deps-android-colors-cold.log`. UIKit's individual translucent separator/fill/modifier values additionally have actual NativeWind CSSInterop compilation/resolver coverage in `scripts/uikit-colors.test.ts`, including light/dark RGBA values; screenshots complement those numeric assertions rather than replacing them. After independent review, the dedicated emulator was shut down; the user's AVD and physical device were untouched.

Android attestation against Firebase, push delivery, Play billing and external feed media remain outside this local isolated run. The Android native modules compile and initialize, and the real app exercises the local API/auth/session/database/reader/subscription paths. iOS StoreKit verification is recorded separately by its test owner.
