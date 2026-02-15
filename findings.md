# Findings

## 2026-02-14

### F-001 Missing separator between adjacent entries

- Area: `apps/mobile/src/modules/entry-list/ItemSeparator.tsx`
- Symptom: separator between some entry pairs intermittently not visible.
- Root cause (likely):
  - separator used `scaleY(0.5)` on a 1px line (sub-pixel rendering instability);
  - separator component returned a shared constant JSX element rather than rendering a fresh element per usage.
- Fix:
  - switched to per-render separator component;
  - replaced transform-based half-pixel trick with `StyleSheet.hairlineWidth`.

### F-002 Unstable list skeleton rendering and key usage

- Area:
  - `apps/mobile/src/modules/entry-list/EntryListContentArticle.tsx`
  - `apps/mobile/src/modules/entry-list/EntryListContentPicture.tsx`
  - `apps/mobile/src/modules/entry-list/EntryListContentVideo.tsx`
- Symptom:
  - `index` as key in list skeletons;
  - randomized picture skeleton heights causing visual jump during rerenders.
- Fix:
  - replaced index keys with stable keys;
  - made picture skeleton height deterministic by variant index;
  - moved skeleton line widths/heights to `StyleSheet` definitions.

### F-003 Unsafe optional-chain non-null assertions in critical flows

- Area:
  - `apps/mobile/src/modules/entry-list/templates/EntrySocialItem.tsx`
  - `apps/mobile/src/modules/settings/routes/Account.tsx`
  - `apps/mobile/src/modules/settings/routes/EditRule.tsx`
- Symptom:
  - `?.` followed by `!` could produce runtime unsafe assumptions.
- Fix:
  - replaced with guarded fallback paths and explicit optional handling;
  - simplified mapping logic in account-provider binding;
  - removed forced non-null usage in action-rule view label resolution.

### F-004 AI summary visual and readability mismatch

- Area:
  - `apps/mobile/src/modules/ai/summary.tsx`
  - `apps/mobile/src/modules/entry-content/EntryAISummary.tsx`
- Symptom:
  - heading color semantic mismatch and oversized summary text in card.
- Fix:
  - aligned title text color to semantic label color;
  - reduced summary font size/line-height for denser, calmer reading;
  - kept explicit loading state during summary generation.

### F-005 Interaction and style consistency gaps in settings/onboarding flows

- Area:
  - `apps/mobile/src/modules/settings/UserHeaderBanner.tsx`
  - `apps/mobile/src/modules/subscription/items/ListSubscriptionItem.tsx`
  - `apps/mobile/src/screens/OnboardingScreen.tsx`
  - `apps/mobile/src/modules/settings/routes/Lists.tsx`
  - `apps/mobile/src/modules/settings/routes/Actions.tsx`
- Symptom:
  - multiple inline style objects and `TouchableOpacity` usage in key touch surfaces;
  - thin separators still depended on scale transforms in some routes.
- Fix:
  - migrated key interactions to `Pressable` where appropriate;
  - extracted style objects to `StyleSheet`;
  - standardized route separators to `StyleSheet.hairlineWidth`.
