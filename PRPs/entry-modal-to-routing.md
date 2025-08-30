# PRP: Entry Modal to Routing Refactoring

## Overview

Refactor the entry content display system from a full-page modal approach to a scoped, column-based routing approach. This will improve user experience by keeping the modal scoped to the entry list column and make the entry content display reflect in the URL for better navigation.

## Current Implementation Analysis

### Current Architecture

- **Three-column layout**: Feed list (left) → Entry list (center) → AI chat (right)
- **Main layout**: `MainDestopLayout` → `SubscriptionColumnContainer` + `<Outlet />` (`CenterColumnLayout`)
- **Entry list**: Located in `CenterColumnLayout` which contains `EntryColumn` and `AIChatLayout`
- **Modal system**: Uses `usePeekModal` hook to display entry content in a full-page modal

### Key Files & Components

#### Current Modal Implementation

- **`usePeekModal.tsx`**: Hook that creates full-page modal using `PeekModal` component
- **`EntryItemWrapper.tsx:126`**: Click handler calls `peekModal(entry.id, "modal")` instead of navigation
- **`PeekModal` component**: Renders modal with `modalClassName` covering entire viewport

#### Routing Infrastructure

- **`useNavigateEntry.ts`**: Contains `getNavigateEntryPath()` function that generates proper entry URLs
- **Route structure**: `/timeline/:timelineId/:feedId/:entryId`
- **Current entry routing**:
  - Layout: `/timeline/[timelineId]/[feedId]/layout.tsx` → `CenterColumnLayout`
  - Index: `/timeline/[timelineId]/[feedId]/index.tsx` → redirects to `ROUTE_ENTRY_PENDING`
  - Entry: `/timeline/[timelineId]/[feedId]/[entryId]/index.tsx` → `EntryLayoutContent`

#### Layout Components

- **`CenterColumnLayout.tsx`**: Two-column layout with entry list and AI chat
- **`EntryLayoutContent.tsx`**: Renders entry content when entryId is present in URL
- **`MainDestopLayout.tsx`**: Root layout with feed column and main content outlet

### Current Flow

1. User clicks entry in `EntryItemWrapper`
2. `handleClick` calls `peekModal(entry.id, "modal")`
3. Modal covers entire viewport, disrupting three-column layout
4. Entry content not reflected in URL routing

## Proposed Solution

### Architecture Changes

Transform the entry content display from a modal overlay to a proper routing-based approach that renders within the entry column scope.

### New Flow

1. User clicks entry in `EntryItemWrapper`
2. `handleClick` calls `navigateEntry()` with `getNavigateEntryPath()`
3. URL changes to `/timeline/:timelineId/:feedId/:entryId`
4. Entry content renders within entry column boundaries via `<Outlet />`

### Key Modifications

#### 1. Modify Entry Click Handler

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/layouts/EntryItemWrapper.tsx:115-129`

Replace modal invocation with navigation:

```typescript
// BEFORE
const handleClick = useCallback(
  (e) => {
    // ... existing logic
    peekModal(entry.id, "modal")
  },
  [peekModal],
)

// AFTER
const handleClick = useCallback(
  (e) => {
    // ... existing logic
    navigateEntry({ entryId: entry.id })
  },
  [navigateEntry],
)
```

#### 2. Update CenterColumnLayout for Entry Display

**File**: `apps/desktop/layer/renderer/src/modules/app-layout/timeline-column/CenterColumnLayout.tsx`

Add conditional rendering for entry content within the entry column:

```typescript
// Current: Simple two-column layout
<div className="h-full flex-1 border-r">
  <EntryColumn />
</div>

// Proposed: Conditional entry content display
<div className="h-full flex-1 border-r">
  <EntryColumn />
  <Outlet /> {/* Renders entry content when entryId is present */}
</div>
```

#### 3. Create Column-Scoped Entry Layout

**New file**: `apps/desktop/layer/renderer/src/modules/entry-column/EntryColumnLayout.tsx`

```typescript
export const EntryColumnLayout = () => {
  const { entryId } = useParams()
  const navigate = useNavigateEntry()

  if (!entryId || entryId === ROUTE_ENTRY_PENDING) {
    return <EntryColumn />
  }

  return (
    <div className="relative h-full">
      {/* Entry list background */}
      <EntryColumn />

      {/* Entry content overlay within column */}
      <div className="absolute inset-0 bg-theme-background border-l">
        <EntryContent
          entryId={entryId}
          onClose={() => navigate({ entryId: null })}
        />
      </div>
    </div>
  )
}
```

#### 4. Update Route Configuration

**File**: `apps/desktop/layer/renderer/src/pages/(main)/(layer)/timeline/[timelineId]/[feedId]/layout.tsx`

Change from `CenterColumnLayout` to new scoped layout:

```typescript
// BEFORE
export { CenterColumnLayout as Component } from "~/modules/app-layout/timeline-column/index"

// AFTER
export { EntryColumnLayout as Component } from "~/modules/entry-column/EntryColumnLayout"
```

## Implementation Tasks

### Phase 1: Core Routing Setup

1. **Create EntryColumnLayout component**
   - Implement conditional rendering for entry content
   - Add proper scoping within entry column boundaries
   - Handle entry close navigation

2. **Update CenterColumnLayout route**
   - Replace component export in layout.tsx
   - Ensure proper outlet rendering

3. **Modify EntryItemWrapper click handler**
   - Replace `peekModal` call with `navigateEntry`
   - Import and use existing navigation utilities

### Phase 2: Layout & Styling

4. **Style scoped entry content**
   - Ensure entry content stays within column boundaries
   - Add proper animations for entry open/close
   - Handle responsive behavior

5. **Update entry content close behavior**
   - Remove modal-specific close logic
   - Implement navigation-based close

### Phase 3: Testing & Validation

6. **Test navigation flow**
   - Verify URL changes correctly
   - Test browser back/forward navigation
   - Validate entry content display

7. **Test edge cases**
   - Direct URL access to entry routes
   - Entry not found scenarios
   - Mobile responsiveness

## Context & References

### Existing Patterns

- **Navigation utilities**: `useNavigateEntry`, `getNavigateEntryPath` already exist
- **Route structure**: Entry routing infrastructure already present
- **Entry content component**: `EntryContent` component already handles rendering

### External Documentation

- **React Router Modal Patterns**: https://blog.logrocket.com/building-react-modal-module-with-react-router/
- **Background Location Pattern**: https://dev.to/unorthodev/how-to-make-routable-modals-in-react-with-react-router-3hgp
- **Scoped Navigation**: https://github.com/remix-run/react-router/discussions/9601

### Best Practices Applied

1. **Nested Route Approach**: Use existing route structure with outlets
2. **Scoped Rendering**: Keep entry content within column boundaries
3. **Persistent Navigation**: URL reflects entry selection state
4. **Smooth Transitions**: Maintain existing animation patterns

## Validation Gates

### Code Quality

```bash
# TypeScript validation
pnpm run typecheck

# Linting
pnpm run lint

# Build validation
pnpm run build:web
```

### Functional Testing

```bash
# Manual testing checklist
1. Click entry in list → URL updates → Entry content displays in column
2. Browser back/forward → Entry content appears/disappears correctly
3. Direct URL access → Entry content renders properly
4. Entry close action → Returns to entry list with correct URL
5. Mobile responsiveness → Entry content adapts to smaller screens
```

### Performance Validation

- No increase in bundle size
- Smooth animations maintained
- No layout shifts during entry display

## Success Criteria

- [ ] Entry clicks trigger navigation instead of modal
- [ ] Entry content displays within column boundaries
- [ ] URL reflects entry selection state
- [ ] Browser navigation works correctly
- [ ] Entry close returns to proper state
- [ ] All existing functionality preserved
- [ ] No visual regression in three-column layout

## Risk Mitigation

### Potential Issues

1. **Layout disruption**: Entry content might overflow column boundaries
2. **Animation conflicts**: Existing animations might conflict with new approach
3. **Mobile compatibility**: Column-scoped display might not work on mobile

### Mitigation Strategies

1. **Absolute positioning**: Use absolute positioning to contain entry content
2. **CSS containment**: Use CSS containment properties for layout isolation
3. **Responsive design**: Implement mobile-specific fallbacks if needed

## Confidence Score: 8/10

This PRP provides a comprehensive approach with:

- ✅ Detailed analysis of current implementation
- ✅ Clear technical specifications
- ✅ Existing code patterns leveraged
- ✅ External best practices incorporated
- ✅ Executable validation steps
- ✅ Risk mitigation strategies

The high confidence comes from the existing navigation infrastructure and clear understanding of the current modal system. The main implementation involves connecting existing pieces rather than building from scratch.
