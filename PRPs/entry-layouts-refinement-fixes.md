# PRP: Entry Content Layout Refinement Fixes

## Overview

Address critical styling and functionality issues in the recently implemented adaptive entry content layouts. This PRP fixes three main areas: Social Media layout typography and avatar styling, Pictures layout carousel integration, and scroll container height calculation issues that cause content truncation.

## Current Issues Analysis

### Issue Context

Following the implementation of adaptive entry content layouts in previous PRPs, user feedback has identified several refinement issues that affect the visual quality and functionality of the layouts.

### 1. Social Media Layout - Typography and Avatar Issues

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`

**Issue 1.1: Author Name Text Size**

```typescript
// Current AuthorHeader.tsx implementation (lines 64-67)
<div className="flex items-center gap-1 text-sm">
  <span className="font-semibold">
    <FeedTitle feed={feed} title={entry.author || feed.title} />
  </span>
```

**Problem**: Author name uses `text-sm` (14px) which is too small for social media context where author prominence is important.

**Issue 1.2: Avatar Border Radius Scale Mismatch**

```typescript
// Current SocialMediaLayout.tsx (line 59)
<FeedIcon fallback feed={feed} entry={entry.iconEntry} size={48} className="mt-1 shrink-0" />

// Current FeedIcon.tsx avatar styling (line 283)
<AvatarImage className="rounded-sm object-cover" asChild src={finalSrc}>
```

**Problem**: Avatar size increased to 48px but border radius remains `rounded-sm` (2px), creating visual inconsistency.

### 2. Pictures Layout - Carousel Implementation Issues

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`

**Issue 2.1: Multiple Image Display**

```typescript
// Current MediaGallery.tsx implementation (lines 47-113)
if (isAllMediaSameRatio) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto", className)}>
      {media.map((mediaItem, i, mediaList) => {
        // Multiple images displayed side by side
```

**Problem**: MediaGallery shows multiple images side by side instead of single image with carousel navigation.

**Issue 2.2: Missing PreviewMediaContent Integration**
**Expected**: Single image display that opens PreviewMediaContent modal on click with carousel functionality.
**Current**: Direct MediaGallery display without modal integration.

**Issue 2.3: Entry List Click Behavior Not Restored**
**Problem**: Previous fixes removed SwipeMedia `onPreview` prop but didn't properly restore the expected clicking behavior for entry list images.

### 3. Scroll Container Height Calculation Issues

**Files**:

- `packages/internal/components/src/ui/scroll-area/ScrollArea.tsx`
- `apps/desktop/layer/renderer/src/modules/entry-content/components/entry-content/EntryContent.tsx`

**Issue 3.1: Height Mismatch**

```typescript
// EntryContent.tsx ScrollArea usage (lines 242-244)
rootClassName={cn(
  "h-0 min-w-0 grow overflow-y-auto print:h-auto print:overflow-visible",
  className,
)}
```

**Problem**: `h-0 grow` pattern causes height calculation issues where content extends beyond scroll container.

**Issue 3.2: Flex Container Min-Height Problem**
**Root Cause**: Flexbox containers with implicit minimum size cause scroll containers to not properly calculate their available height.

## Proposed Solutions

### 1. Social Media Layout Typography and Avatar Fixes

#### 1.1 Increase Author Name Font Size

**Strategy**: Update AuthorHeader to use larger text size for social media context

**Implementation**:

```typescript
// AuthorHeader.tsx - Enhanced author name styling
<div className="flex items-center gap-1">
  <span className="text-base font-semibold"> {/* Changed from text-sm */}
    <FeedTitle feed={feed} title={entry.author || feed.title} />
  </span>
```

#### 1.2 Scale Avatar Border Radius Appropriately

**Strategy**: Use size-responsive border radius that scales with avatar dimensions

**Implementation**:

```typescript
// FeedIcon.tsx - Size-based border radius
const getBorderRadius = (size: number) => {
  if (size <= 24) return "rounded-sm"   // 2px for small avatars
  if (size <= 32) return "rounded-md"   // 6px for medium avatars
  if (size <= 48) return "rounded-lg"   // 8px for large avatars
  return "rounded-xl"                   // 12px for extra large avatars
}

<AvatarImage className={cn("object-cover", getBorderRadius(size))} />
```

### 2. Pictures Layout Single Image Carousel Implementation

#### 2.1 Replace MediaGallery with Single Image Display

**Strategy**: Show only the first image with click-to-carousel functionality using PreviewMediaContent

**Implementation Pattern**:

```typescript
// PicturesLayout.tsx - Single image with carousel
const PicturesLayout: React.FC<PicturesLayoutProps> = ({ entryId, ... }) => {
  const entry = useEntry(entryId, (state) => ({ media: state.media }))
  const previewMedia = usePreviewMedia()

  const handleImageClick = () => {
    if (entry?.media && entry.media.length > 0) {
      previewMedia(
        entry.media.map(m => ({
          url: m.url,
          type: m.type,
          blurhash: m.blurhash,
          fallbackUrl: m.preview_image_url
        })),
        0 // Start at first image
      )
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Single image display */}
      {entry?.media && entry.media.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Media
              src={entry.media[0].url}
              className="w-full max-h-96 object-contain rounded-lg cursor-pointer"
              onClick={handleImageClick}
            />
            {entry.media.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                +{entry.media.length - 1} more
              </div>
            )}
          </div>
        </div>
      )}
      {/* Rest of content */}
    </div>
  )
}
```

#### 2.2 Restore Entry List Image Click Behavior

**Strategy**: Re-add proper onPreview functionality to SwipeMedia in entry list contexts

**Implementation**:

```typescript
// picture-item.tsx - Restore preview functionality
<SwipeMedia
  media={entryMedia}
  className={/* ... */}
  onPreview={(media, i) => {
    previewMedia(
      media.map(m => ({
        url: m.url,
        type: m.type,
        blurhash: m.blurhash,
        fallbackUrl: m.preview_image_url
      })),
      i
    )
  }}
/>
```

### 3. Scroll Container Height Fixes

#### 3.1 Apply Min-Height Fix to Flex Containers

**Strategy**: Add explicit `min-height: 0` to flex containers to fix height calculation

**Implementation**:

```typescript
// EntryContent.tsx - Fix flex container height calculation
<div className="flex flex-col h-full min-h-0"> {/* Add min-h-0 */}
  <ScrollArea
    className="flex-1 min-h-0" {/* Ensure flex child can shrink */}
    flex
    rootClassName={cn(
      "overflow-y-auto print:h-auto print:overflow-visible",
      className,
    )}
  >
    {children}
  </ScrollArea>
</div>
```

#### 3.2 Update ScrollArea Component for Better Height Handling

**Strategy**: Enhance ScrollArea component to handle flex container height issues

**Implementation**:

```typescript
// ScrollArea.tsx - Enhanced flex support
export const ScrollArea = ({
  flex,
  rootClassName,
  viewportClassName,
  ...props
}) => {
  return (
    <ScrollElementContext value={viewportRef}>
      <Root className={cn(
        "overflow-hidden",
        flex && "min-h-0", // Add explicit min-height for flex contexts
        rootClassName
      )}>
        <Viewport
          className={cn(
            "block size-full",
            flex && "[&>div]:!flex [&>div]:!flex-col [&>div]:!min-h-0", // Add min-h-0 to flex children
            viewportClassName
          )}
          // ... rest of props
        >
          {children}
        </Viewport>
      </Root>
    </ScrollElementContext>
  )
}</brace-for-issue>
```

## Implementation Tasks

### Phase 1: Social Media Layout Typography and Avatar Fixes (Priority: High)

#### Task 1.1: Update AuthorHeader Font Sizes

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/shared/AuthorHeader.tsx`

- Change author name from `text-sm` to `text-base` for better prominence
- Ensure consistency across all AuthorHeader usages
- Test with different author name lengths

#### Task 1.2: Implement Size-Responsive Avatar Border Radius

**File**: `apps/desktop/layer/renderer/src/modules/feed/feed-icon/FeedIcon.tsx`

- Create `getBorderRadius()` utility function based on avatar size
- Update AvatarImage className to use responsive border radius
- Test with different avatar sizes (20px, 32px, 48px, 64px)

#### Task 1.3: Update SocialMediaLayout Avatar Integration

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`

- Verify 48px avatar size works with new border radius
- Test visual consistency with typography changes
- Ensure proper spacing and alignment

### Phase 2: Pictures Layout Single Image Carousel (Priority: High)

#### Task 2.1: Replace MediaGallery with Single Image Display

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`

- Remove MediaGallery usage
- Implement single image display with first image from media array
- Add click handler for PreviewMediaContent modal
- Add visual indicator for multiple images ("+X more" overlay)

#### Task 2.2: Create Picture-Specific Media Component

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/shared/SingleImageDisplay.tsx`

- Create reusable single image display component
- Include click-to-carousel functionality
- Handle edge cases (no images, single image, multiple images)
- Support different aspect ratios and sizing

#### Task 2.3: Restore Entry List Image Click Behavior

**File**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/picture-item.tsx`

- Re-add `onPreview` prop to SwipeMedia component
- Ensure proper media format for PreviewMediaContent
- Test clicking behavior in entry list vs content view
- Verify no conflicts with entry navigation

### Phase 3: Scroll Container Height Fixes (Priority: Critical)

#### Task 3.1: Apply Min-Height Fixes to Entry Content

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/entry-content/EntryContent.tsx`

- Add `min-h-0` classes to flex containers
- Update ScrollArea usage to include flex height fixes
- Test with different content lengths and screen sizes
- Verify fix applies to all layout types (Social Media, Videos, Articles, Pictures)

#### Task 3.2: Enhance ScrollArea Component

**File**: `packages/internal/components/src/ui/scroll-area/ScrollArea.tsx`

- Add explicit `min-h-0` support for flex contexts
- Update flex child selectors to include min-height fixes
- Ensure backward compatibility with existing usage
- Test across different scroll scenarios

#### Task 3.3: Test Scroll Fixes Across All Layouts

**Files**: All layout components

- Test Social Media layout with long content
- Test Video layout with long descriptions
- Test Articles layout for regressions
- Test Pictures layout after restructuring
- Verify mobile responsive behavior

### Phase 4: Integration Testing and Polish (Priority: Medium)

#### Task 4.1: Cross-Layout Consistency Testing

- Verify typography consistency across all layouts
- Test avatar sizing consistency in different contexts
- Ensure PreviewMediaContent modal works consistently
- Test scroll behavior across all entry types

#### Task 4.2: Performance and Accessibility Testing

- Verify no performance regressions with scroll fixes
- Test keyboard navigation with new carousel behavior
- Ensure proper focus management in PreviewMediaContent
- Test screen reader compatibility

## Context & References

### Codebase Architecture Understanding

#### Core Components to Modify

- **AuthorHeader.tsx**: Typography improvements for author names
- **FeedIcon.tsx**: Size-responsive border radius implementation
- **PicturesLayout.tsx**: Single image display with carousel integration
- **ScrollArea.tsx**: Flex container height calculation fixes
- **EntryContent.tsx**: Scroll container height fixes
- **picture-item.tsx**: Restore image click preview behavior

#### Existing Patterns to Follow

- **PreviewMediaContent.tsx**: Modal-based media carousel (Embla carousel integration)
- **usePreviewMedia**: Hook for triggering media preview modals
- **Media component**: Image display with loading states and proxy support
- **UIKit color system**: Consistent with `text-base`, `rounded-lg` etc.

### External Best Practices & Documentation

#### CSS Flexbox Height Calculation Fixes

- **Min-Height Zero Pattern**: https://stackoverflow.com/questions/21515042/scrolling-a-flexbox-with-overflowing-content
- **Flex Container Overflow**: https://moduscreate.com/blog/how-to-fix-overflow-issues-in-css-flex-layouts/
- **Critical Insight**: "There's a special case where the min-height of flex items defaults to the content size. We have to explicitly set the min height to zero."

#### React Image Carousel Best Practices

- **Single Image Display**: https://cloudinary.com/blog/add-a-responsive-image-carousel-to-your-react-app
- **Click Navigation**: Custom controls with callback functions and hasNext/hasPrev state
- **Responsive Design**: Automatic layout adjustment based on screen size
- **Performance**: Lazy loading and video play control on selected slides

#### Typography and Avatar Scaling

- **Responsive Avatar Sizing**: Border radius should scale proportionally with avatar size
- **Social Media Typography**: Author names should be prominent (16px+ / text-base) for readability
- **Apple UIKit Standards**: Consistent size relationships (border radius = size/6 to size/4)

### Implementation Guidelines

#### Typography Scaling Pattern

```typescript
// Size-based styling patterns
const getFontSize = (context: "social" | "article" | "compact") => {
  switch (context) {
    case "social":
      return "text-base font-semibold" // 16px for prominence
    case "article":
      return "text-sm font-semibold" // 14px for articles
    case "compact":
      return "text-xs font-medium" // 12px for compact
  }
}
```

#### Border Radius Scaling Pattern

```typescript
// Size-responsive border radius
const getBorderRadius = (size: number) => {
  const ratio = size / 8 // Scale factor
  if (ratio <= 3) return "rounded-sm" // 2px
  if (ratio <= 4) return "rounded-md" // 6px
  if (ratio <= 6) return "rounded-lg" // 8px
  return "rounded-xl" // 12px
}
```

#### Single Image Carousel Pattern

```typescript
// Media display with carousel integration
const handleImageClick = useCallback(() => {
  if (mediaArray.length > 0) {
    previewMedia(
      mediaArray.map(transformMediaForPreview),
      0, // Initial index
    )
  }
}, [mediaArray, previewMedia])
```

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

- [ ] Author name displays with `text-base` font size (16px)
- [ ] Author name maintains proper font weight and color
- [ ] Avatar border radius scales appropriately with 48px size
- [ ] Avatar maintains circular appearance with proper radius
- [ ] Typography is consistent across different author name lengths
- [ ] Layout maintains proper spacing and alignment

#### Pictures Layout Validation

- [ ] Single image displays instead of multiple images side by side
- [ ] First image from media array is shown as primary display
- [ ] "+X more" indicator appears when multiple images exist
- [ ] Clicking single image opens PreviewMediaContent modal
- [ ] Carousel navigation works properly in modal (left/right arrows)
- [ ] Image maintains proper aspect ratio and scaling
- [ ] No layout shift when transitioning to/from modal

#### Entry List Image Click Validation

- [ ] Clicking images in picture-item triggers PreviewMediaContent modal
- [ ] Modal opens with correct initial image and media array
- [ ] Entry navigation still works when clicking non-image areas
- [ ] No conflicts between image click and entry click behaviors
- [ ] Touch gestures work properly on mobile devices

#### Scroll Container Height Validation

- [ ] Long content no longer gets cut off at bottom in Social Media layout
- [ ] Long content no longer gets cut off at bottom in Video layout
- [ ] ScrollArea height matches available container height
- [ ] Content scrolls smoothly to very bottom without truncation
- [ ] No visual glitches or layout shifts during scrolling
- [ ] Fix applies to all entry types (Articles, Social Media, Videos, Pictures)
- [ ] Mobile responsive behavior maintains proper scrolling

### Performance & Integration Testing

- [ ] No layout shift when switching between entry types
- [ ] PreviewMediaContent modal opens smoothly without lag
- [ ] Image loading states display properly
- [ ] Scroll performance maintained with height fixes
- [ ] No memory leaks with modal-based image preview
- [ ] Typography rendering remains crisp at all zoom levels

## Success Criteria

### Primary Objectives

- [ ] **Social Media**: Author names display prominently with proper typography
- [ ] **Social Media**: Avatar border radius scales appropriately with size
- [ ] **Pictures**: Single image display with click-to-carousel functionality
- [ ] **Pictures**: Entry list image clicking restored and working properly
- [ ] **Scroll Heights**: Long content fully visible without truncation in all layouts
- [ ] **Performance**: All fixes implemented without performance regression

### Quality Standards

- [ ] Zero regressions in existing ArticleLayout functionality
- [ ] All layout types maintain consistent typography patterns
- [ ] PreviewMediaContent modal integration works seamlessly
- [ ] ScrollArea height calculation robust across different content types
- [ ] Mobile responsive design maintained across all fixes

### User Experience Improvements

- [ ] Social media author information more readable and prominent
- [ ] Picture viewing experience enhanced with proper carousel integration
- [ ] Content consumption improved with full scroll accessibility
- [ ] Visual consistency improved with proper avatar styling
- [ ] Interaction patterns consistent between entry list and content view

## Risk Assessment & Mitigation

### High-Risk Areas

#### 1. ScrollArea Height Calculation Changes

**Risk**: Height fixes might break existing scroll behavior in other components
**Mitigation**:

- Apply changes incrementally with thorough testing
- Maintain backward compatibility with existing ScrollArea usage
- Test all scroll containers across the application
- Use feature flags for gradual rollout if needed

#### 2. PreviewMediaContent Modal Integration

**Risk**: Modal stacking conflicts or keyboard navigation issues
**Mitigation**:

- Test modal behavior with existing modal stack system
- Verify proper cleanup of modal state
- Ensure keyboard navigation (ESC, arrows) works correctly
- Test touch gestures on mobile devices

#### 3. Typography Changes Impact

**Risk**: Font size changes might break layout in compact or mobile views
**Mitigation**:

- Test with various author name lengths and special characters
- Verify responsive behavior across all screen sizes
- Check international character rendering (CJK, Arabic, etc.)
- Maintain proper line height and spacing

### Medium-Risk Areas

#### Component Dependencies

**Risk**: Changes to shared components might affect other features  
**Mitigation**:

- Audit all usage of modified components before changes
- Use backward-compatible prop additions
- Test AuthorHeader and FeedIcon usage across application
- Verify no breaking changes to component APIs

#### Image Loading Performance

**Risk**: Single image display might affect loading performance
**Mitigation**:

- Maintain existing lazy loading behavior
- Test image proxy functionality with new implementation
- Profile image loading performance before and after changes
- Ensure proper loading states and error handling

### Rollback Strategy

- Implement changes as separate commits for easy reversal
- Use CSS custom properties for easy typography adjustments
- Maintain original component implementations as backup
- Feature flag capability for critical scroll height fixes

## Additional Considerations

### Accessibility Standards

- Ensure author names maintain proper contrast ratios with larger text
- Test screen reader compatibility with typography changes
- Verify keyboard navigation works properly with image carousel
- Maintain proper heading hierarchy across layout changes

### Internationalization Support

- Test typography changes with different language character sets
- Ensure proper text flow with RTL languages
- Verify avatar and text spacing works with longer translated text
- Maintain consistent translation key usage across components

### Future Extensibility

- Typography pattern scalable to other layout types
- Border radius pattern reusable for other avatar contexts
- ScrollArea fixes applicable to other scroll containers
- Image carousel pattern extensible to video content

## Confidence Score: 9/10

This PRP provides a comprehensive solution with high implementation confidence:

### Strengths

- ✅ **Root Cause Analysis**: Identified exact source of each issue with specific file/line references
- ✅ **Proven External Research**: Incorporates CSS flexbox best practices and React carousel patterns
- ✅ **Focused Scope**: Addresses specific reported issues without unnecessary complexity
- ✅ **Detailed Implementation**: Clear component-by-component changes with code examples
- ✅ **Risk Management**: Identified potential issues with concrete mitigation strategies
- ✅ **Comprehensive Testing**: Detailed validation steps for each change
- ✅ **Existing Pattern Leverage**: Uses established components (PreviewMediaContent, usePreviewMedia)

### Implementation Confidence Factors

1. **Clear Problem Definition**: Each issue traced to specific code locations with examples
2. **External Best Practices**: CSS flexbox fixes and React carousel patterns are well-established
3. **Component Reuse**: Leveraging existing PreviewMediaContent rather than building new carousel
4. **Incremental Approach**: Changes can be implemented and tested independently
5. **Minimal Breaking Changes**: Most fixes involve styling adjustments and proper component usage
6. **Established Patterns**: Typography and avatar sizing follow existing codebase conventions

### Minor Risk Areas

- **ScrollArea Changes**: Need thorough testing across different content types
- **Typography Impact**: Must verify responsive behavior with larger text
- **Modal Integration**: Ensure smooth interaction with existing modal stack

The high confidence score reflects that this PRP addresses well-defined styling and functional issues using established patterns and external best practices, with clear implementation steps and comprehensive validation approaches.
