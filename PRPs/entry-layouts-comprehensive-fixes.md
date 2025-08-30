# PRP: Comprehensive Entry Content Layout Fixes

## Overview

Fix critical issues in the adaptive entry content layouts that prevent proper EntryHeader display, cause inconsistent layout patterns, and implement unwanted popup behaviors. This PRP addresses specific problems identified with SocialMedia, Pictures, and Videos layouts while also fixing entry navigation behavior.

## Current Issues Analysis

### Issue Context

Following the implementation of adaptive entry content layouts in `PRPs/adaptive-entry-content-layouts.md` and `PRPs/adaptive-entry-layouts-fixes.md`, several critical issues remain that affect user experience:

### 1. Social Media Layout - Blank EntryHeader Issue

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`
**Root Cause**: EntryHeader component explicitly hides all functionality for SocialMedia view

**Current Implementation Problem**:

```typescript
// EntryHeader.tsx lines 72-77 - Explicitly hides actions for SocialMedia
{view !== FeedViewType.SocialMedia && (
  <div className="relative flex shrink-0 items-center justify-end gap-2">
    <EntryHeaderActions entryId={entryId} view={view} compact={compact} />
    <MoreActions entryId={entryId} view={view} />
  </div>
)}
```

**Missing Functionality**:

- Star/bookmark actions
- Share actions
- More actions menu (read/unread toggle, archive, etc.)
- Entry metadata display when scrolled
- Read status indicators

**Additional Issue**: SocialMedia entries also use `<article>` tag instead of `NavLink` in `EntryItemWrapper.tsx:212`, preventing proper navigation.

### 2. Pictures Layout - Wrong Layout Structure

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`

**Current Structure**: Split-screen layout (image left, metadata sidebar right)

```typescript
<div className="flex h-full max-h-[85vh]">
  <div className="flex-1 flex items-center justify-center bg-black/5"> {/* Image area */}
  <div className="w-80 border-l bg-background flex flex-col"> {/* Sidebar */}
```

**Requested Structure**: Article-like layout (title/author top, content below) with multimedia separated from text

### 3. Videos Layout - AI Summary Position

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/VideosLayout.tsx`

**Current Order**:

1. EntryTitle
2. AuthorHeader
3. ContentBody
4. AISummary ← Currently at bottom

**Requested Order**: AI Summary should be above ContentBody (between AuthorHeader and ContentBody)

### 4. Video Entry Popup Logic

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/video-item.tsx`

**Current Behavior**: Lines 104-126 - Click triggers modal popup instead of navigation

```typescript
onClick={(e) => {
  if (iframeSrc) {
    modalStack.present({
      title: "",
      content: (props) => (<PreviewVideoModalContent src={iframeSrc} entryId={entryId} {...props} />),
    })
  } else {
    previewMedia(entry.media) // Triggers video preview popup
  }
}}
```

### 5. Picture Entry Popup Logic

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/picture-item.tsx`

**Current Behavior**: Lines 46-48 - SwipeMedia triggers preview popup

```typescript
<SwipeMedia
  onPreview={(media, i) => {
    previewMedia(media, i) // Triggers picture preview popup instead of navigation
  }}
/>
```

## Proposed Solutions

### 1. Social Media Layout Fixes

#### 1.1 Restore EntryHeader Functionality

**Strategy**: Remove the SocialMedia exclusion from EntryHeader component and ensure proper integration

**File Changes**:

- `EntryHeader.tsx`: Remove `view !== FeedViewType.SocialMedia` condition
- `EntryItemWrapper.tsx`: Change SocialMedia from `<article>` to `NavLink` like other entry types
- `SocialMediaLayout.tsx`: Ensure layout works with EntryHeader display

#### 1.2 Layout Integration Pattern

Follow the same pattern as ArticleLayout:

```typescript
// EntryContent.tsx integration (lines 120-127)
{!isInPeekModal && (
  <EntryHeader
    entryId={entryId}
    view={view}
    className={cn("@container h-[55px] shrink-0 px-3", classNames?.header)}
    compact={compact}
  />
)}
// Then SocialMediaLayout renders below EntryHeader
```

### 2. Pictures Layout Restructuring

#### 2.1 Change to Article-Style Layout

**New Structure**: Title/Author on top, content below, with multimedia content separated

```typescript
// New PicturesLayout structure
<div className="space-y-6 p-6 max-w-4xl mx-auto">
  {/* Title and Author Section */}
  <div className="space-y-4">
    <EntryTitle entryId={entryId} compact={false} />
    <AuthorHeader entryId={entryId} showAvatar={true} avatarSize={40} />
  </div>

  {/* Multimedia Content Section */}
  <div className="space-y-4">
    <MediaGallery entryId={entryId} />
  </div>

  {/* Text Content Section */}
  <div className="space-y-4">
    <ContentBody entryId={entryId} translation={translation} compact={compact} noMedia={true} />
    <AISummary entryId={entryId} />
  </div>
</div>
```

#### 2.2 Multimedia Content Separation

- Use `noMedia={true}` on ContentBody to remove multimedia elements from text
- Display multimedia content separately in dedicated MediaGallery section
- Maintain click-to-preview functionality via `usePreviewMedia` hook

### 3. Videos Layout - AI Summary Position Fix

**Simple Reordering**: Move AISummary component above ContentBody

```typescript
// Current order in VideosLayout.tsx (lines 49-72)
<EntryTitle entryId={entryId} compact={compact} />
<AuthorHeader entryId={entryId} showAvatar={true} avatarSize={40} />
<AISummary entryId={entryId} /> {/* Move here - above content */}
<ContentBody entryId={entryId} translation={translation} compact={compact} noMedia={true} />
```

### 4. Remove Video Entry Popup Logic

#### 4.1 Update Video Item Click Handler

**File**: `video-item.tsx`
**Change**: Remove modal popup logic, allow normal entry navigation

```typescript
// Replace current onClick handler (lines 104-126) with normal entry behavior
// Remove the modal presentation logic entirely
// Let EntryItemWrapper handle navigation naturally
```

#### 4.2 Preserve Video Preview in Layout

**Note**: Users can still preview videos via the VideosLayout which shows the video player properly

### 5. Remove Picture Entry Popup Logic

#### 5.1 Update Picture Item OnPreview Handler

**File**: `picture-item.tsx`  
**Change**: Remove `onPreview` prop from SwipeMedia to disable popup behavior

```typescript
// Remove onPreview prop from SwipeMedia (lines 46-48)
<SwipeMedia
  // onPreview={(media, i) => previewMedia(media, i)} // Remove this line
  className="aspect-square w-full overflow-hidden rounded-md"
/>
```

#### 5.2 Maintain Preview in PicturesLayout

**Note**: Users can still preview images via the restructured PicturesLayout with proper MediaGallery integration

## Implementation Plan

### Phase 1: Fix Social Media Layout EntryHeader (Priority: Critical)

#### Task 1.1: Remove SocialMedia Exclusion from EntryHeader

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/entry-header/EntryHeader.tsx`

```typescript
// Remove condition: view !== FeedViewType.SocialMedia
// Lines 72-77: Always show EntryHeaderActions regardless of view type
<div className="relative flex shrink-0 items-center justify-end gap-2">
  <EntryHeaderActions entryId={entryId} view={view} compact={compact} />
  <MoreActions entryId={entryId} view={view} />
</div>
```

#### Task 1.2: Fix SocialMedia Entry Navigation

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/layouts/EntryItemWrapper.tsx`

```typescript
// Change line 212 from:
const Link = view === FeedViewType.SocialMedia ? "article" : NavLink
// To:
const Link = NavLink // Use NavLink for all entry types including SocialMedia
```

#### Task 1.3: Verify SocialMediaLayout Integration

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`

- Ensure layout works properly when EntryHeader is displayed above it
- Test star collection overlay positioning doesn't conflict with EntryHeader
- Verify responsive behavior with EntryHeader present

### Phase 2: Restructure Pictures Layout (Priority: High)

#### Task 2.1: Implement Article-Style Layout Structure

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`

- Replace split-screen layout with vertical article-style layout
- Move title and author to top section
- Create dedicated multimedia content section with MediaGallery
- Separate text content section with `noMedia={true}`

#### Task 2.2: Update MediaGallery Integration

- Ensure MediaGallery component supports click-to-preview functionality
- Maintain existing `usePreviewMedia` hook integration for modal previews
- Test multiple image handling and carousel behavior

### Phase 3: Fix Videos Layout AI Summary Position (Priority: Medium)

#### Task 3.1: Reorder Components

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/VideosLayout.tsx`

- Move `<AISummary entryId={entryId} />` from line 72 to after AuthorHeader (around line 53)
- Maintain proper spacing and styling
- Test responsive behavior and content flow

### Phase 4: Remove Popup Logic (Priority: Medium)

#### Task 4.1: Remove Video Entry Popup Logic

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/video-item.tsx`

- Remove or simplify onClick handler (lines 104-126)
- Remove `PreviewVideoModalContent` modal presentation logic
- Allow normal entry navigation through EntryItemWrapper

#### Task 4.2: Remove Picture Entry Popup Logic

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/picture-item.tsx`

- Remove `onPreview` prop from SwipeMedia component (lines 46-48)
- Test that normal entry navigation still works
- Verify pictures can still be previewed through PicturesLayout

### Phase 5: Testing and Validation (Priority: High)

#### Task 5.1: Layout Functionality Testing

- Test EntryHeader actions work in SocialMedia layout (star, share, more actions)
- Test Pictures layout displays properly with article-style structure
- Test Videos layout shows AI summary in correct position
- Test normal entry navigation works for all layouts

#### Task 5.2: Integration Testing

- Test entry factory routing still works correctly
- Test mobile responsive behavior across all layout changes
- Test no regressions in ArticleLayout functionality
- Test modal preview functionality where preserved

## Context & References

### Codebase Architecture Understanding

#### Entry Content System Files

- **Factory**: `layouts/factory.ts` - Layout component selection
- **Integration**: `EntryContent.tsx` - Main integration point with EntryHeader
- **Layouts**: Individual layout components in `layouts/` directory
- **Entry Wrapper**: `EntryItemWrapper.tsx` - Controls navigation vs article tag usage

#### Key Components to Modify

- **EntryHeader.tsx**: Remove SocialMedia exclusion (lines 72-77)
- **EntryItemWrapper.tsx**: Fix SocialMedia navigation (line 212)
- **SocialMediaLayout.tsx**: Verify EntryHeader integration
- **PicturesLayout.tsx**: Complete restructure to article-style layout
- **VideosLayout.tsx**: Simple component reordering
- **video-item.tsx**: Remove popup click logic
- **picture-item.tsx**: Remove SwipeMedia onPreview prop

#### Existing Patterns to Follow

- **ArticleLayout**: Reference for proper EntryHeader integration
- **MediaGallery**: Pattern for multimedia content display
- **EntryHeaderActions**: Component providing star, share, more actions
- **usePreviewMedia**: Hook for maintaining preview functionality where appropriate

### External Best Practices & Documentation

#### React Component Restructuring

- **Conditional Rendering Removal**: https://react.dev/learn/conditional-rendering
- **Component Composition**: https://react.dev/learn/passing-props-to-a-component
- **Layout Patterns**: Clean separation of content sections for better UX

#### Entry Navigation Patterns

- **React Router NavLink**: https://reactrouter.com/en/main/components/nav-link
- **Navigation vs Modal UX**: Best practices for content discovery vs preview

#### Layout Design Principles

- **Article Layout Standards**: Title → Author → Content flow for readability
- **Multimedia Content Separation**: Clear distinction between media and text content
- **Progressive Enhancement**: Maintain preview functionality while improving base navigation

### UI/UX Reference Standards

#### Social Media Layout

- **Standard Pattern**: Avatar + Author info + Actions in header area
- **Content Flow**: Header actions → AI summary → Content → Media gallery
- **Action Accessibility**: All entry actions should be consistently available

#### Pictures Layout

- **Article-Style Pattern**: Linear flow from title → author → multimedia → text
- **Content Separation**: Clear visual separation between media and text sections
- **Preview Enhancement**: Click-to-preview maintains advanced image viewing

#### Videos Layout

- **Information Hierarchy**: AI summary provides context before content consumption
- **Content Flow**: Video → Title → Author → AI Summary → Description/Content

## Validation Gates

### Code Quality Checks

```bash
# TypeScript validation
pnpm run typecheck

# Linting validation
pnpm run lint:tsl
pnpm run lint

# Code formatting
pnpm run format

# Build validation
pnpm run build:web
```

### Functional Testing Checklist

#### Social Media Layout Validation

- [ ] EntryHeader displays with all action buttons (star, share, more actions menu)
- [ ] Social media entries navigate properly when clicked (no article tag behavior)
- [ ] Star/bookmark functionality works correctly
- [ ] Share actions function properly
- [ ] More actions menu provides read/unread, archive, etc. options
- [ ] Entry metadata displays when scrolled
- [ ] Layout integrates properly with EntryHeader space allocation

#### Pictures Layout Validation

- [ ] Title displays at top of layout
- [ ] Author information displays below title
- [ ] Multimedia content displays in dedicated section
- [ ] Text content displays separately without embedded media
- [ ] AI summary appears in text content section
- [ ] MediaGallery maintains click-to-preview functionality
- [ ] Layout is responsive and readable on all screen sizes

#### Videos Layout Validation

- [ ] AI summary displays above main content (after AuthorHeader)
- [ ] Video player displays properly at top
- [ ] Title and author information display correctly
- [ ] Text content excludes multimedia elements (`noMedia={true}`)
- [ ] Component spacing and flow is visually appealing

#### Entry Navigation Validation

- [ ] Video entries navigate to content view instead of showing popup
- [ ] Picture entries navigate to content view instead of showing popup
- [ ] Normal entry clicking behavior consistent across all entry types
- [ ] Preview functionality still available within content layouts
- [ ] No regressions in other entry types (Article, Audio, Notifications)

### Performance & Integration Testing

- [ ] No layout shift when EntryHeader is displayed with SocialMedia layout
- [ ] Entry factory routing continues to work seamlessly
- [ ] Modal preview functionality works when explicitly triggered
- [ ] Bundle size impact minimal (layout restructuring only)
- [ ] Mobile responsive design maintained across all layouts

## Success Criteria

### Primary Objectives

- [ ] **Social Media**: EntryHeader displays with all actions like other entry types
- [ ] **Pictures**: Article-style layout (title/author top, content below) with multimedia separation
- [ ] **Videos**: AI summary positioned above main content
- [ ] **Navigation**: Entry clicks navigate to content view instead of triggering popups
- [ ] **Functionality**: All existing features preserved (preview, actions, etc.)

### Quality Standards

- [ ] Zero regressions in existing ArticleLayout functionality
- [ ] Entry factory system continues routing correctly
- [ ] All EntryHeader actions work consistently across layouts
- [ ] Mobile responsive design maintained
- [ ] Performance impact negligible

### User Experience Improvements

- [ ] Consistent action availability across all entry types (star, share, etc.)
- [ ] Better content organization with proper information hierarchy
- [ ] Improved navigation flow (click to view, preview when desired)
- [ ] Cleaner content separation between multimedia and text
- [ ] Maintained advanced preview functionality where appropriate

## Risk Assessment & Mitigation

### High-Risk Areas

#### 1. EntryHeader Integration Changes

**Risk**: Removing SocialMedia exclusion might break existing layout assumptions
**Mitigation**:

- Test thoroughly with various social media entry types
- Verify responsive behavior with EntryHeader space allocation
- Implement feature flag for gradual rollout if needed

#### 2. Navigation Behavior Changes

**Risk**: Changing from `<article>` to `NavLink` might affect performance or behavior
**Mitigation**:

- Profile performance impact of additional NavLink components
- Test keyboard navigation and accessibility compliance
- Verify no conflicts with existing event handlers

#### 3. Pictures Layout Restructuring

**Risk**: Complete layout change might break existing user expectations
**Mitigation**:

- Maintain click-to-preview functionality for advanced image viewing
- Test with various image entry types and content lengths
- Consider user feedback mechanism for layout preference

### Medium-Risk Areas

#### Component Dependencies

**Risk**: Changes to shared components might affect other areas  
**Mitigation**:

- Audit all usage of modified components before changes
- Use backward-compatible prop additions where possible
- Test all entry list item displays remain functional

#### Preview Functionality

**Risk**: Removing popup logic might eliminate desired preview features
**Mitigation**:

- Preserve advanced preview functionality within content layouts
- Ensure MediaGallery and video players provide equivalent experience
- Test that preview modals still work when explicitly triggered

### Rollback Strategy

- Implement changes incrementally by layout type
- Use git feature branches for each major change
- Maintain existing layout components as backup during transition
- Feature flag capability for reverting individual layout changes

## Additional Considerations

### Accessibility Standards

- Ensure EntryHeader actions maintain proper ARIA labels and keyboard navigation
- Test screen reader compatibility with restructured layouts
- Maintain proper heading hierarchy across all layout changes
- Verify video player controls remain keyboard accessible

### Internationalization Support

- Test all layout changes with RTL languages
- Ensure proper text flow in restructured Pictures layout
- Verify action button layouts work with translated text
- Maintain consistent translation key usage across layouts

### Future Extensibility

- Pattern established for other layout types (Audio, Notifications)
- EntryHeader integration approach reusable for new layout types
- Component separation supports future customization options
- Layout factory system ready for additional media types

## Confidence Score: 8.5/10

This PRP provides a comprehensive solution with high implementation confidence:

### Strengths

- ✅ **Root Cause Analysis**: Identified exact source of each issue with file and line references
- ✅ **Proven Patterns**: Leverages existing successful EntryHeader and ArticleLayout patterns
- ✅ **Focused Scope**: Addresses specific reported issues without unnecessary complexity
- ✅ **Detailed Implementation**: Clear file-by-file changes with code examples
- ✅ **Risk Management**: Identified potential issues with concrete mitigation strategies
- ✅ **Comprehensive Testing**: Detailed validation steps for each change
- ✅ **External Research**: Incorporates best practices for navigation and layout design

### Implementation Confidence Factors

1. **Clear Problem Definition**: Each issue has been thoroughly analyzed with exact file locations
2. **Existing Foundation**: EntryHeader, ArticleLayout, and navigation patterns are already proven
3. **Minimal Breaking Changes**: Most changes involve removing exclusions or simple reordering
4. **Component Reuse**: Leveraging existing tested components rather than creating new ones
5. **Incremental Approach**: Changes can be implemented and tested independently
6. **Fallback Options**: Clear rollback strategy for each component change

### Minor Risk Factors

- **Layout Integration**: Need to verify EntryHeader spacing works with each layout type
- **Navigation Changes**: SocialMedia routing change requires thorough cross-platform testing
- **User Experience**: Pictures layout restructuring is most significant UX change

The high confidence score reflects that this PRP addresses well-defined issues using existing proven components and patterns, with clear implementation steps and comprehensive validation approaches.
