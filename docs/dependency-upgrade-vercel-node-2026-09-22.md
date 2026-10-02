# Vercel Node builder review

Approve `@vercel/node` 5.8.22 → 12.0.1. Hold npm latest 13.0.1 because its release metadata and peer-dependency change do not have a corresponding verifiable public changelog/source revision at review time.

## Source evidence

- [Official changelog at the reviewed source commit](https://github.com/vercel/vercel/blob/c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb/packages/node/CHANGELOG.md).
- [Upstream git comparison](https://github.com/vercel/vercel/compare/f82a013d7a74896bb804d73c9355146a2505b5f0...c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb), read with scope `packages/node/src` and `packages/node/package.json`.
- [Latest public package source](https://github.com/vercel/vercel/blob/c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb/packages/node/package.json) identifies 12.0.1. The September 8 internal-sync commit is the last public change to this directory. The old 5.8.22 provenance identifies `f82a013d7a74896bb804d73c9355146a2505b5f0`.

Read every intervening changelog entry through 12.0.1 and all nine changed implementation/package files (1,036 diff lines). Downloaded official npm artifacts for 5.8.22, 12.0.1 and 13.0.1 to verify emitted declaration and runtime changes. Evidence is cached at `/tmp/folo-dependency-review-20260922/vercel__node`.

## Changes and local impact

The builder detects whether a project compiler exposes the TS6 JavaScript API. If absent, it invokes the project's native TypeScript executable with an isolated temporary config, collects emitted files/source maps, bounds captured output, serializes concurrent emits and cleans up temporary output. Existing legacy compilers retain the former API path. Compilation becomes asynchronous at its call sites.

Routing middleware now supports explicit proxy entrypoints and configured matchers. New projects dated September 1 or later use Node middleware in dev, and in builds when the platform rollout flag enables it; explicit edge configuration remains honored, and explicit proxy entrypoints reject edge runtime. Matcher helpers move to build-utils. A failed user-module import restores the temporarily patched HTTP listen method. Native CLI workers resolve the system Node executable; Bun installation/selection is shared with build-utils, and package-manager detection receives devEngines/Node metadata. Build-utils becomes a peer dependency, provided by the CLI (12.0.1 expects 14.9.1).

Folo imports only `VercelRequest` and `VercelResponse` in `api/vercel_webhook.ts`. The emitted `dist/index.d.ts` is byte-for-byte identical between 5.8.22 and 12.0.1; no request, response, signature or body API migration is needed. The package is not imported at runtime by the webhook. No new middleware/runtime setting is introduced by this change.

The real local webhook HTTP integration test invokes the actual handler with raw chunked UTF-8 bytes and a dummy secret, verifies accepted/rejected HMAC signatures, and exercises body interruption. It passes. It deliberately uses a staging event so no Cloudflare action is sent. Deployment and platform-managed builder execution are not claimed as tested.

## Why 13.0.1 is held

Registry metadata has neither gitHead nor provenance for 13.0.1; no corresponding public package tag or source update was found. Its npm `dist` files are all identical to 12.0.1, but `package.json` changes the build-utils peer to 14.10.1. This narrows the unknown change but does not supply the missing official release history/source evidence for it. Since the user explicitly requires changelog and git-diff review for each update, 12.0.1 is the latest verified version approved here.
