# iOS dependency-upgrade verification — 2026-09-22

## Environment and final artifact

All ordinary-app interactions targeted the dedicated `Folo Deps E2E 20260922` simulator (`0BF02D72-E6DE-43C6-9BE8-7489FD951BD9`, iOS 26.5). No other simulator or user installation was reset. API requests used the isolated local service at `http://localhost:3000`; no production account or data was involved.

The final ordinary Release simulator app is `/tmp/folo-deps-ios-ordinary-build/Build/Products/Release-iphonesimulator/Folo.app`, bundle `is.follow`, version 0.5.9 (12). It uses independent DerivedData so the separate IAP artifact is not overwritten. It was built with `PROFILE=e2e-ios-simulator`, `EXPO_PUBLIC_E2E_ENV_PROFILE=local`, `EXPO_PUBLIC_E2E_LANGUAGE=en`, `ONLY_ACTIVE_ARCH=YES`, `ARCHS=arm64`, and `CODE_SIGNING_ALLOWED=NO`. Xcode build passed; `/tmp/folo-deps-ios-ordinary-final-build.log` contains the final build result. `EXPO_PUBLIC_E2E_IAP_NATIVE` is unset, `STOREKIT_TESTING` is not defined, and `otool -L` confirms no StoreKitTest framework linkage. The obsolete `/tmp/folo-deps-ios-final-ordinary.app` copy was removed after being superseded.

Installed versions include Expo 57.0.24, React 19.2.8, React Native 0.86.3, Gesture Handler 3.3.0, Reanimated 4.7.0, Worklets 0.13.0, Screens 4.28.0, and Keyboard Controller 1.22.5. Compatibility/change reviews are in the mobile and animation reports.

The final app includes keyboard dismissal, Discover URL preservation, sanitized FollowUrl errors, UIKit alpha compatibility, immutable migration snapshots, native-root readiness gating, and the onboarding Markdown renderer. Its `rn-web/html-renderer/assets/index-DZ2Ze5om.js` exactly matches `out/rn-web` by SHA-256 (`4a9633218ea0898d0c474a7b2fb55071c5b6feced0b752a2582720238ccb6a98`); its stylesheet is `index-DmJdjm9r.css`. All temporary lifecycle-diagnostic code was removed before this build, and its three diagnostic markers are absent from the actual Hermes bundle.

## Runner correction

The documented full iOS command previously executed only `auth.yaml`. `e2e/run-maestro.sh` now executes `auth.yaml` followed by `content.yaml` against the same signed-in app, stops on a failure, and writes separate `auth/junit.xml` and `content/junit.xml` reports alongside independent debug folders. Shell syntax and `git diff --check` passed. The README describes these outputs.

## Earlier diagnostic run

Before the last keyboard/search/error-display refinements, the clean simulator passed the authentication journey (3m 58s) and content journey (3m 1s). Authentication covered real registration, sign-out confirmation, and email sign-in. AXe independently confirmed the signed-in home screen and three onboarding articles. Content covered discover/follow, subscriptions, article/video tabs, article navigation/back, long-press read/unread mutations, and unsubscribe. A separate local API read confirmed the test account's subscriptions changed from one onboarding feed to zero. Profile modal presentation, interactive swipe dismissal, and subsequent Settings → General navigation also worked.

These results motivated repeating both journeys on the final artifact rather than treating the earlier binary as the final verification.

## Earlier full-run checkpoint

The corrected `pnpm run e2e:ios` completed with exit 0 on the earlier Release artifact and a fresh local account. Authentication passed in **4m 41s** and content passed in **2m 56s**. The independent reports are `/tmp/folo-deps-maestro-ios/final-full/auth/junit.xml` and `/tmp/folo-deps-maestro-ios/final-full/content/junit.xml`; command output is `/tmp/folo-deps-ios-final-full.log`.

AXe independently captured the actual article screen during the content flow. `/tmp/folo-ios-final-entry-auto.png` shows the title, feed attribution, AI summary, article image, and body text inside the upgraded WebView/HTML renderer. It also exposed literal Markdown markers in the onboarding content. The Android review confirmed that desktop parses this same fixture as Markdown, so mobile requires an additional renderer correction and visual recheck; that follow-up is recorded below.

After both flows completed, the profile modal opened from the home avatar, dismissed with an interactive downward swipe, and Settings → General still accepted taps. The settled accessibility snapshot `/tmp/folo-ios-final-general-after-modal-settled.json` contains the General heading, navigation back control, and AI Summary switch. The app was then terminated and launched again without clearing its data; `/tmp/folo-ios-final-cold-start.png` shows the signed-in home screen and the three onboarding entries, confirming persisted-session recovery.

## Local native IAP follow-up

The ordinary Release artifact above did not define `STOREKIT_TESTING`. Therefore its local helper shortcut is not evidence for the upgraded `expo-iap` purchase callback. A separate explicitly flagged build was used for this additional check; its completed results are recorded separately below.

### StoreKit fixture and simulator diagnosis

The native purchase check uses a separate task-created iOS 18.5 simulator (`FAD6D669-EC1D-4C69-A997-8CFA51FD7FFE`), a dedicated local account, the isolated API, and a Release app with `EXPO_PUBLIC_E2E_IAP_NATIVE=1` and `STOREKIT_TESTING`. The ordinary app does not enable this path. A temporary workspace/scheme under `/tmp/folo-iap-xcode` activates the local StoreKit configuration before launching the compiled app; the repository Xcode project and normal scheme are unchanged. No Apple account was entered and no real purchase was made. Product discovery may consult the store catalog before the local readiness check, so this result does not claim that all Apple network activity was absent.

The first iOS 26.5 (23F77) attempt failed to save a StoreKit test configuration (code 3), consistent with the [Apple developer-forum report](https://developer.apple.com/forums/thread/826971). Moving to 18.5 alone was insufficient: the repository's test fixture still produced an empty product catalog. An independent UIKit + StoreKitTest app isolated the fixture from Expo, React Native and `expo-iap`:

| Controlled configuration                                            | Actual native result                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| One local non-consumable readiness product                          | 1 product                                                         |
| Full original Folo fixture plus that same product                   | 0 products                                                        |
| Same fixture with subscription groups removed                       | 1 product                                                         |
| Add subscription group references and correct free-trial mode only  | 0 products                                                        |
| Also restore group localizations and subscription code-offer arrays | 8 products (the probe, preview product and all six subscriptions) |

Both repository `.storekit` resources now include `subscriptionGroupID`, group `localizations: []`, per-subscription `codeOffers: []`, and `introductoryOffer.paymentMode: "free"`. These match the [Apple Backyard Birds reference configuration](https://github.com/apple/sample-backyard-birds/blob/f955a1f0f7136c38cc016cbfcd1ad85e89c596c5/Misc/Store.storekit). The grouped experiment establishes the broken fixture and repaired result; it does not claim that every missing field was independently necessary. The native control then purchased both the non-consumable and Basic annual subscription with verified `Xcode` transactions using the exact same subscription/settings objects as Folo. No real App Store product configuration changed.

The simulator also exposed a second testing issue. After injecting `userCancelled`, `setSimulatedError(nil, forAPI: .purchase)` returned successfully and the native getter returned `nil`, but the next independent `Product.purchase()` still failed with `StoreKitError.unknown`. This reproduces without JavaScript or Expo. Resetting test settings, re-enabling disabled dialogs and retaining existing transactions restored the next native purchase. The test-only helper now follows that sequence, checks the cleared error and the unique local product again, and logs `purchase-error-cleared`. A subsequent JS purchase awaits the same recovery promise; recovery failure remains closed instead of falling through to the real store. Apple documents the normal nil-clearing contract in [WWDC23: What's new in StoreKit 2](https://developer.apple.com/videos/play/wwdc2023/10140/); the additional reset is justified by the observed 18.5 behavior.

Raw control evidence is in `/tmp/folo-storekit-probe/{purchase-events,cancel-events,cancel-reset-events,fixed-catalog-events}.log`, with the corresponding standalone source/configuration variants retained in that directory. The final flagged Folo build passed in `/tmp/folo-deps-ios-iap-build-final.log` and contains the final root presentation gate, UIKit variables, migration snapshots and `index-DZ2Ze5om.js` renderer. Mobile provider typecheck and targeted lint passed.

## Final ordinary app and startup ordering regression

The first clean launch of the final dependency set failed the automatic login assertion after 30 seconds: `/tmp/folo-deps-ios-ordinary-complete.log` and `/tmp/folo-deps-ios-ordinary-auth-failure.png`. The backend returned an anonymous session correctly, and tapping the Articles/Videos selector changed the actual screen, ruling out a blanket touch-interception failure. Temporary local-only lifecycle instrumentation then recorded the Login route entering the navigation atom **206 ms before** the native root's `onAppear`. No modal component render followed; tapping the avatar again found the same Login route already at the top of the stack. This demonstrates a startup ordering/render failure, rather than proving that UIKit discarded an already-rendered modal.

Extended the existing Android root-readiness gate to iOS: routes remain in the atom while `ScreenItemsMapper` waits for the root native `onAppear`. Existing focus and lifecycle callbacks remain composed. The controlled second run recorded root appearance, root rerender and Login modal render in order, followed by Login's own native appearance. Its screenshot is `/tmp/folo-deps-ios-ordinary-gate-fixed.png`, and the safe event-only trace is `/tmp/folo-deps-ios-root-gate-events.log`. All temporary HTTP diagnostics were then removed and the Release app rebuilt. This application startup race became reproducible with the final initialization timing; it is not attributed to a proven upstream UIKit defect.

The final uninstrumented app passed the complete fresh-account sequence with no manual recovery: **authentication 2m 41s, content 3m 8s**. This covers initial automatic login, real registration, logout/JS reload and automatic login presentation, password login, unfollow/discover/follow, subscription display, a **single ordinary article tap with no retry option**, actual body paragraph and Markdown heading assertions, native long-press read/unread actions, and final unsubscribe. Evidence is `/tmp/folo-deps-ios-ordinary-final.log` and `/tmp/folo-deps-maestro-ios/ordinary-final/{auth,content}/junit.xml`, both with zero failures.

Mobile typecheck passed (`/tmp/folo-deps-ios-root-gate-typecheck.log`); targeted lint has zero errors and four pre-existing warnings (`/tmp/folo-deps-ios-root-gate-lint.log`). Formatting, YAML syntax and `git diff --check` passed.

The additional AXe pass terminated the process and opened `folo://add?url=folo%3A%2F%2Fonboarding&type=url` through the actual iOS URL-confirmation prompt. The restored session reached the real Follow form with no login screen or migration stall, and saving it returned to the timeline. Evidence: `/tmp/folo-deps-ios-ordinary-cold-deeplink-ready.json` and `.png`. The article then opened with one AXe tap; `/tmp/folo-deps-ios-ordinary-reader.png` shows parsed **Timeline** emphasis and the **Your Timeline** heading instead of raw Markdown punctuation.

Stable Settings and Appearance screens were inspected in both system themes: `/tmp/folo-deps-ios-ordinary-settings-light.png`, `/tmp/folo-deps-ios-ordinary-settings-dark.png`, `/tmp/folo-deps-ios-ordinary-appearance-light.png`, and `/tmp/folo-deps-ios-ordinary-appearance-dark.png`. User name/Edit, icons, secondary text, fills and separators remain visible, complementing the actual CSSInterop numeric alpha tests. A separate existing status-bar limitation remains: dark status-bar text can have poor contrast against the Settings gradient and the dark Appearance background. This is not counted as a passing contrast check or attributed to the UIKit alpha compatibility fix.

Finally opened the Profile modal from the home avatar, dismissed it with a real downward swipe, then navigated Settings → General. The settled accessibility tree contains the General heading and AI Summary switch, and `/tmp/folo-deps-ios-ordinary-general-after-modal.png` records the responsive screen. The dedicated iOS 26.5 simulator was then shut down after restoring light appearance. No user simulator, production account or production service was altered. The final app remains at the independent DerivedData path above; logs and screenshots are retained.

### Final native IAP result

The final app exercised the actual `expo-iap` `requestPurchase` / `useIAP` callbacks; the local `buyProduct` shortcut was bypassed. All times below are 2026-09-22 UTC+8, from the narrowly filtered `/tmp/folo-ios-iap18-final-events.log`:

| Time     | Observed result                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------ |
| 16:00:38 | Unique local probe visible, dialogs disabled, session ready                                      |
| 16:01:27 | All six local subscription products loaded                                                       |
| 16:04:14 | First actual request returned `user-cancelled`; loading cleared and native recovery completed    |
| 16:04:38 | Retried request → `purchase-success` → `server-verified` → `transaction-finished`                |
| 16:06:20 | Restore request → `restore-purchases` → `server-verified`; UI displayed “Subscription restored.” |

The local API changed from no billing subscription to `source=apple`, `plan=basic`, `status=active`, `productId=is.follow.basic.yearly`, `periodEnd=2027-09-22T08:04:38.273Z`, and `canManage=true`. The same API fields remained unchanged after restore. Independent, read-only database checks before and after restore confirmed `environment=Xcode`, current entitlement, the expected account owner and exactly one matching row. Their safe projections were byte-identical: `/tmp/folo-deps-iap-db-verification.txt` and `/tmp/folo-deps-iap-db-restored-verification.txt`. Neither file includes signed transactions, account tokens or personal data. Purchase and restore screenshots are `/tmp/folo-ios-iap18-final-purchased.png` and `/tmp/folo-ios-iap18-final-restored.png`.

Server verification used the real Apple SDK and the existing local environment support. Review found that its Xcode/LocalTesting decoder skips signature verification; the backend now excludes both environments in production. Real-SDK regression tests reject forged Xcode and LocalTesting transactions in production while retaining the local Xcode test path. The local purchase check therefore did not require weakening production verification or adding Apple server credentials.

This establishes the local purchase, cancellation recovery, explicit transaction finishing and restore paths. Real Apple sandbox/production account authentication, payments, external notifications, subscription renewal delivery and production rollout remain outside this local test. The dedicated 18.5 app and temporary Xcode workspace were stopped after verification; its simulator was shut down. The test app, narrowly filtered event logs, screenshots and standalone diagnostic sources are retained. After both native checks completed, the task-created DerivedData intermediates and compiler caches were removed to recover disk space. Both final `.app` bundles, build logs, screenshots and standalone control evidence were preserved.
