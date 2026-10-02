# HTTP, YAML and Web Firebase dependency review

Reviewed official release notes and the actual upstream source changes below. Versions are exact direct-dependency pins. The cached evidence under `/tmp/folo-dependency-review-20260922` includes full upstream diffs; conclusions below describe the source paths read, rather than treating downloaded files as reviewed evidence.

## Axios 1.18.1 → 1.20.0

- [Changelog](https://github.com/axios/axios/blob/v1.20.0/CHANGELOG.md), [1.20 release](https://github.com/axios/axios/releases/tag/v1.20.0), [source diff](https://github.com/axios/axios/compare/a209bfb1e5dcbce3cecbf4bd955339d006358887...84a9f3b9a4f3244b8c8e818f557d64c7b964fb25).
- Read Axios/InterceptorManager, dispatch/merge configuration, signal composition, URL combination, HTTP/fetch/XHR adapter and proxy-bypass changes. Config lookup now excludes prototype-inherited options; fetch options cannot replace protected request fields. Interceptor IDs remain monotonic when ejected; failed synchronous interceptors prevent dispatch. Already-aborted signals fail immediately, fetch `maxRedirects: 0` means manual redirects, progress flushes on completion, and status-zero XHR navigation aborts report `ECONNABORTED`. HTTP pooled-socket listeners and data-URL size limits are corrected. The form-data floor incorporates header-injection fixes.
- The only repository reference is the landing manifest; no application import was found. There is no Axios-backed product flow to invent a test for. Landing build remains the integration gate.

## Fastify 5.10.0 → 5.12.5

- [Official releases](https://github.com/fastify/fastify/releases), [source diff](https://github.com/fastify/fastify/compare/c47975e8a4c0cb1cb066749b948c0e6e22c97663...ba235fdcd9a83a4c7ccf793f7b2596a8f65389b6).
- Read intervening 5.11/5.12 release notes and `fastify.js`, route, reply, handle-request, content-type parser, four-oh-four, validation and schema normalization diffs. Changes include QUERY method/body rules, lowercase route lookup, quoted content-type parameters, resetting global-regexp parser state, preserving async request context, correct reply header removal, and applying current not-found preHandlers to `callNotFound`. Shutdown closes idle connections without force-closing active ones. Schema handling now honors boolean false and recursively normalizes header schemas; async validator results no longer confuse user `{error,value}` objects with validation control objects. Falsy coerced root values are preserved.
- Folo SSR uses Fastify with middie and request-context in both Node and the Worker shim. Four real local HTTP tests cover the plugin combination, concurrent isolated context, HTML/content headers, delegated 404 hooks, quoted JSON content types and falsy payloads, plus the raw-body flows below. Parent task additionally validates actual SSR routes/build.

## js-yaml 5.2.1 → 5.4.2

- [Changelog](https://github.com/nodeca/js-yaml/blob/494400bd45cad078123cfc057e674a9a0a8d9983/CHANGELOG.md), [source diff](https://github.com/nodeca/js-yaml/compare/ac16b42c46c11c5c7f66062bfc78b168b5f07ecd...494400bd45cad078123cfc057e674a9a0a8d9983).
- Read 5.2.2–5.4.2 notes and loader/constructor, dumper/styler, timestamp, merge and defaults source. The new AST API is not used by Folo. Relevant fixes address nested-flow parse complexity, prototype fallback, alias/merge validation and expansion limits, years 0000–0099, whitespace-only quoting, Unicode key lengths, per-document BOMs and block-scalar newline retention. `forceQuotes` only applies to strings. Merge syntax outside key position remains ordinary text.
- Consumers are Electron hot-update manifests and release YAML scripts; they use ordinary load/dump with `lineWidth: -1`, without custom tags or AST mutation. A manifest roundtrip test verifies nested file records, SHA512 strings, maximum safe size, quoted dates, Unicode multiline release notes and whitespace-only strings against the installed package. Actual update download/application remains the parent task's desktop gate.

## raw-body 3.0.2 → 4.0.0

- [History](https://github.com/stream-utils/raw-body/blob/c3949f885af40733c680eb410b7d1f5aeddc2877/HISTORY.md), [source diff](https://github.com/stream-utils/raw-body/compare/4cf8e0a2591802e01f05f93e39a6a5b3610a183c...c3949f885af40733c680eb410b7d1f5aeddc2877).
- Read the 4.0 history, package exports/engines and TypeScript implementation of options, Node stream accumulation, decoder and completion cleanup. It is ESM-only and requires Node 22+. Buffer output remains the default. TextDecoder replaces iconv behavior, UTF-32 is absent, invalid limits throw, strings from pre-encoded streams are rejected, and premature stream closure settles as an aborted request. Length and limit enforcement happen during accumulation. Folo supplies neither an encoding nor a custom limit, so decoder changes do not affect signature bytes.
- `api/vercel_webhook.ts` imports the default function and computes HMAC over the Buffer. A real HTTP test invokes that actual handler with a dummy local secret and a staging event, splits multibyte UTF-8 across two-byte chunks, and verifies valid signatures return 200 while a changed signature returns 403. No Cloudflare call occurs. A second real socket test verifies interrupted bodies reject with `request.aborted` rather than hanging. Deployment must use Node 22+; local verification uses Node 26.

## Firebase Web 12.16.0 → 12.19.0

- [Firebase changelog](https://github.com/firebase/firebase-js-sdk/blob/9045b759b70e9d19b8cf007d69d988893d845a1e/packages/firebase/CHANGELOG.md), [source diff](https://github.com/firebase/firebase-js-sdk/compare/51aca877ca4706229dc9e77b3ebf787c91c91078...9045b759b70e9d19b8cf007d69d988893d845a1e).
- Read aggregate release notes and app, messaging, installations, component and util changelog/source changes. The actual app API preserves same-config initialization and improves different-config duplicate-app diagnostics. Error-template interpolation in util switches from a regex to linear scanning to avoid pathological work; missing placeholders and fallback behavior remain explicit. Messaging token requests and service-worker listeners do not change in this range; its source edits are formatting/type organization, with inherited util/component updates.
- Desktop `push-notification.ts` uses only `firebase/app` and `firebase/messaging`. New AI/Gemini/Imagen, Firestore and App Check features are outside its import graph. Existing service-worker readiness, permission, token-registration and notification-navigation flows remain the meaningful browser checks. Successful real FCM delivery requires an authorized environment and is not claimed by the local library tests.

## Validation

- `pnpm --filter @follow/ssr exec vitest run --config vitest.config.ts src/lib/dependency-upgrade-http.integration.test.ts`: 4 tests passed; `/tmp/folo-http-integration-tests.log`.
- `pnpm --filter @follow/electron-main exec vitest run --config vitest.config.ts src/updater/dependency-upgrade-yaml.test.ts`: 1 test passed; `/tmp/folo-yaml-integration-tests.log`.
- SSR typecheck passed; `/tmp/folo-http-typecheck.log`. Mobile typecheck after Firebase/IAP migration also passed; `/tmp/folo-mobile-services-typecheck.log`.
- These are real installed-library/HTTP integration checks, not a substitute for parent-task browser, Electron or native simulator E2E results. No deployment, external webhook, production credentials or real purchase was used.
