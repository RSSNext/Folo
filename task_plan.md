# Mobile Full Review Plan

## Goal

Deliver a comprehensive mobile review and optimization pass across functionality, design, interaction, and performance, with validated fixes and regression checks.

## Scope

- `apps/mobile/src/**`
- related mobile i18n under `locales/mobile/default/**`

## Phases

- [x] P0: Reproduce and fix the reported missing entry separator bug.
- [x] P1: List rendering and scrolling audit (FlashList usage, separators, callbacks, item rendering cost).
- [x] P2: UX and interaction audit for critical flows (Home, Subscriptions, Discover, Entry detail, Settings).
- [x] P3: Visual consistency and readability audit (typography hierarchy, color semantics, loading/error states).
- [x] P4: Full validation and regression pass.

## Validation Checklist

- [x] `pnpm run typecheck`
- [x] `pnpm run lint:fix`
- [x] `pnpm run test`
- [x] `npm exec turbo run format:check typecheck lint`
- [x] `npm exec turbo run test`

## Notes

- Follow React Native best practices from `vercel-react-native-skills`.
- Keep fixes simple, maintainable, and type-safe.
