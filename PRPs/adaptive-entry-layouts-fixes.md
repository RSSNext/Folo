# PRP: Fix Adaptive Entry Content Layout Issues

## Overview

Fix specific layout and functionality issues in the existing adaptive entry content layouts implemented in `PRPs/adaptive-entry-content-layouts.md`. The adaptive layouts are working but have implementation issues that affect user experience across Social Media, Pictures, and Videos layouts.

## Current Issues Analysis

### Current Implementation Status

The adaptive layout factory system is successfully implemented:

- **Factory System**: `getEntryContentLayout()` in `layouts/factory.ts` correctly routes to layout-specific components
- **Layout Components**: SocialMediaLayout, PicturesLayout, VideosLayout, ArticleLayout are created
- **Integration**: `AdaptiveContentRenderer` in `EntryContent.tsx` properly uses the factory pattern

### Specific Issues Identified

#### 1. Social Media Layout Issues

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`

**Problem 1**: Duplicate Author Display

- Lines 47-54: Shows `AuthorHeader` with avatar (48px size)
- Lines 58-62: Shows another `AuthorHeader` without avatar
- **Result**: Author name appears twice in the layout

**Problem 2**: Show More Button Logic Still Present

- Lines 40-42: Uses `autoExpandLongSocialMedia` setting to conditionally show `CollapsedSocialMediaItem`
- Lines 96-143: `CollapsedSocialMediaItem` implements "show more" button with LRU cache
- **User Request**: Remove this logic entirely and force full display

**Problem 3**: AI Summary Position

- Line 87: `<AISummary entryId={entryId} />` is at the bottom of the content
- **User Request**: Move AI summary to the top of the layout

#### 2. Pictures Layout Issues

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`

**Problem**: Mixed Media and Text Content

- Current implementation uses `SwipeMedia` for carousel but doesn't follow "PreviewMediaContent logic"
- Text content mixed with multimedia content
- **User Request**: Separate multimedia content (using PreviewMediaContent) from text content

#### 3. Videos Layout Issues

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/VideosLayout.tsx`

**Problem 1**: VideoPlayer Using Mini Player

- VideoPlayer component (`shared/VideoPlayer.tsx` lines 56-71) creates both `miniIframeSrc` and `iframeSrc`
- Lines 129-133: Uses `miniIframeSrc` for preview/hover (optimized for small sizes)
- **User Request**: Use `iframeSrc` directly for better large-screen experience

**Problem 2**: Content Duplication

- `ContentBody` component (lines 61-66) renders with `noMedia={false}` by default
- This includes images/iframes in text content that duplicate what's shown in video player
- **User Request**: Remove multimedia elements from text content, show only text

## Proposed Solutions

### 1. Social Media Layout Fixes

#### 1.1 Fix Duplicate Author Display

Remove the separate avatar display and use single AuthorHeader with proper positioning:

```typescript
// Current problematic structure (lines 45-62):
<div className="flex gap-4 p-6 max-w-4xl mx-auto">
  {/* Avatar */}
  <div className="shrink-0">
    <AuthorHeader entryId={entryId} showAvatar={true} avatarSize={48} />
  </div>
  {/* Content */}
  <div className="min-w-0 flex-1 space-y-4">
    <AuthorHeader entryId={entryId} showAvatar={false} />
    // ... rest of content
  </div>
</div>

// Fixed structure - single author header:
<div className="flex gap-3 p-6 max-w-4xl mx-auto">
  <FeedIcon fallback feed={feed} entry={entry.iconEntry} size={48} className="shrink-0 mt-1" />
  <div className="min-w-0 flex-1 space-y-3">
    <AuthorHeader entryId={entryId} showAvatar={false} />
    // ... content follows
  </div>
</div>
```

#### 1.2 Remove Show More Logic

Replace conditional wrapper with direct content display:

```typescript
// Remove lines 40-42 autoExpandLongSocialMedia logic
// Remove lines 96-143 CollapsedSocialMediaItem component entirely

// Replace EntryContentWrapper usage (lines 66-73) with direct ContentBody:
<ContentBody
  entryId={entryId}
  translation={translation}
  compact={compact}
  className="text-base leading-relaxed"
/>
```

#### 1.3 Move AI Summary to Top

Reorder components to show AI Summary after author header:

```typescript
<div className="min-w-0 flex-1 space-y-3">
  <AuthorHeader entryId={entryId} showAvatar={false} />
  <AISummary entryId={entryId} className="text-sm" />  {/* Move to top */}
  <ContentBody {...contentProps} />
  <MediaGallery {...mediaProps} />
</div>
```

### 2. Pictures Layout Fixes

#### 2.1 Implement PreviewMediaContent Pattern

Replace current SwipeMedia carousel with PreviewMediaContent for better multimedia handling:

```typescript
// Current implementation uses SwipeMedia (lines 52-61)
// Replace with PreviewMediaContent pattern:

import { usePreviewMedia } from "~/components/ui/media/hooks"

const PicturesLayout: React.FC<PicturesLayoutProps> = ({ entryId, ... }) => {
  const entry = useEntry(entryId, (state) => ({ media: state.media, content: state.content }))

  const textContent = useMemo(() => (
    <div className="space-y-4">
      <ContentBody entryId={entryId} noMedia={true} {...props} /> {/* Text only */}
      <AISummary entryId={entryId} />
    </div>
  ), [entryId, ...])

  const previewMedia = usePreviewMedia(textContent)

  return (
    <div className="flex h-full max-h-[85vh]">
      <div className="flex-1 flex items-center justify-center bg-black/5">
        {entryMedia.length > 0 ? (
          <button
            onClick={() => previewMedia(entryMedia, 0)}
            className="w-full h-full"
          >
            <Media src={entryMedia[0].url} className="max-h-full object-contain" />
          </button>
        ) : (
          <div className="center">No media content</div>
        )}
      </div>

      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <AuthorHeader entryId={entryId} showAvatar={true} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EntryTitle entryId={entryId} compact={true} />
          {textContent} {/* Separated text content */}
        </div>
      </div>
    </div>
  )
}
```

### 3. Videos Layout Fixes

#### 3.1 Use Full-Size iframe Instead of Mini Player

Modify VideoPlayer to use `iframeSrc` directly for large-screen optimization:

```typescript
// In VideosLayout.tsx, pass preferFullSize prop to VideoPlayer:
<VideoPlayer
  entryId={entryId}
  preferFullSize={true}  // New prop to use iframeSrc
  className="w-full aspect-video"
/>

// In shared/VideoPlayer.tsx, modify to respect preferFullSize:
export const VideoPlayer: React.FC<VideoPlayerProps & { preferFullSize?: boolean }> = ({
  preferFullSize = false,
  ...props
}) => {
  const displaySrc = preferFullSize ? iframeSrc : miniIframeSrc

  return (
    <div className="aspect-video w-full" onClick={handleClick}>
      {displaySrc ? (
        <ViewTag
          src={displaySrc}
          className="aspect-video w-full rounded-md object-cover"
        />
      ) : (
        // Fallback to media preview
      )}
    </div>
  )
}
```

#### 3.2 Filter Media from Text Content

Create text-only version of ContentBody by adding `noMedia` prop:

```typescript
// In VideosLayout.tsx (lines 61-66), add noMedia={true}:
<ContentBody
  entryId={entryId}
  translation={translation}
  compact={compact}
  noMedia={true}  // Remove images/iframes/videos from text
  className="text-base"
/>

// ContentBody.tsx already supports noMedia prop (line 49)
// This will filter out multimedia elements from HTML content
```

## Implementation Tasks

### Phase 1: Social Media Layout Fixes

#### Task 1.1: Fix Duplicate Author Headers

**File**: `SocialMediaLayout.tsx`

- Remove duplicate AuthorHeader components (lines 47-54 and 58-62)
- Use single FeedIcon + AuthorHeader pattern from original social-media-item.tsx
- Maintain proper spacing and styling

#### Task 1.2: Remove Show More Logic

**File**: `SocialMediaLayout.tsx`

- Remove `autoExpandLongSocialMedia` usage (lines 40-42)
- Delete `CollapsedSocialMediaItem` component entirely (lines 96-143)
- Replace `EntryContentWrapper` with direct `ContentBody` usage

#### Task 1.3: Reorder AI Summary Position

**File**: `SocialMediaLayout.tsx`

- Move `<AISummary entryId={entryId} />` from line 87 to after AuthorHeader
- Add appropriate spacing and styling for top position

### Phase 2: Pictures Layout Enhancement

#### Task 2.1: Implement PreviewMediaContent Integration

**File**: `PicturesLayout.tsx`

- Import and use `usePreviewMedia` hook
- Replace SwipeMedia carousel with clickable preview that opens PreviewMediaContent modal
- Separate multimedia and text content rendering

### Phase 3: Videos Layout Enhancement

#### Task 3.1: Update VideoPlayer for Large Screen

**File**: `shared/VideoPlayer.tsx`

- Add `preferFullSize` prop to use `iframeSrc` instead of `miniIframeSrc`
- Implement proper responsive design for large screens

#### Task 3.2: Filter Text Content

**File**: `VideosLayout.tsx`

- Update ContentBody usage to include `noMedia={true}` prop
- Ensure multimedia elements are filtered from text display

### Phase 4: Testing and Validation

#### Task 4.1: Layout Validation

- Test each layout with various entry types
- Verify author information displays correctly
- Confirm media handling works as expected
- Test responsive behavior on different screen sizes

#### Task 4.2: Integration Testing

- Verify factory pattern still routes correctly
- Test layout switching between different entry types
- Confirm no regressions in ArticleLayout

## Context & References

### Existing Codebase Components

#### Key Files to Modify

- `SocialMediaLayout.tsx` - Main fixes for duplicate author and show more logic
- `PicturesLayout.tsx` - PreviewMediaContent integration
- `VideosLayout.tsx` - Full-size iframe and text filtering
- `shared/VideoPlayer.tsx` - preferFullSize prop support
- `shared/ContentBody.tsx` - Already supports noMedia prop

#### Key Files to Reference

- `social-media-item.tsx` - Original social media layout pattern (single author header)
- `PreviewMediaContent.tsx` - Modal-based media preview with sidebar support
- `AuthorHeader.tsx` - Shared author display component
- `MediaGallery.tsx` - Media display patterns

### External Best Practices

#### Responsive iframe Guidelines

- **Modern CSS Approach**: Use `aspect-ratio: 16/9` for responsive video containers
- **Large Screen Optimization**: Implement max-width constraints to prevent oversized displays
- **Performance**: Use appropriate iframe sources based on screen size and context

**Reference**: https://blog.logrocket.com/best-practices-react-iframes/
**Reference**: https://cloudinary.com/guides/video-effects/responsive-video-embedding-embed-video-iframe-size-relative-to-screen-size

#### HTML Content Filtering

- **Text Extraction**: Use `noMedia` flags to filter multimedia elements from HTML content
- **DOM-based Filtering**: Leverage existing HTML processing to remove specific tags
- **Content Separation**: Maintain clear separation between multimedia and text content

**Reference**: Server-side content filtering approaches for media removal
**Reference**: https://www.bookstack.cn/read/crawl4ai-0.4-en/dcca2e8c0a744b29.md

### UI Reference Patterns

#### Social Media Layout

- **Single Author Header**: Follow Twitter-like pattern with avatar + name + handle + timestamp
- **Content Flow**: Author → AI Summary → Text Content → Media Gallery
- **No Collapse Logic**: Display full content without truncation in content view

#### Pictures Layout

- **Modal Preview**: Use PreviewMediaContent for sophisticated media viewing
- **Sidebar Metadata**: Article-like sidebar with text content separate from media
- **Click to Preview**: Simple click interaction to open full preview modal

#### Videos Layout

- **Full-Size Player**: Use appropriate iframe source for screen size
- **Text-Only Content**: Filter multimedia from description to avoid duplication
- **Standard Flow**: Video Player → Title → Author → Description (text only) → AI Summary

## Validation Gates

### Code Quality

```bash
# TypeScript validation
pnpm run typecheck

# Linting validation
pnpm run lint:tsl
pnpm run lint

# Format validation
pnpm run format

# Build validation
pnpm run build:web
```

### Functional Testing Checklist

#### Social Media Layout

- [ ] Author name appears only once (not duplicated)
- [ ] Author header shows avatar, name, handle (if Twitter), and timestamp
- [ ] AI summary appears at the top, below author header
- [ ] Content displays in full without "show more" button
- [ ] Media gallery displays correctly below content
- [ ] Layout matches original social-media-item.tsx patterns

#### Pictures Layout

- [ ] Multimedia content separated from text content
- [ ] Clicking images opens PreviewMediaContent modal
- [ ] Sidebar displays text content with proper overflow handling
- [ ] Author header displays in sidebar
- [ ] AI summary appears in sidebar text content area

#### Videos Layout

- [ ] Video player uses full-size iframe (not mini version)
- [ ] Video player displays properly at large screen sizes
- [ ] Text content below video contains no duplicate images/media
- [ ] Author information displays below video
- [ ] AI summary appears at bottom of text content

### Performance Validation

- [ ] No layout shift when switching between entry types
- [ ] Video iframe loads appropriately for screen size
- [ ] PreviewMediaContent modal opens smoothly
- [ ] Text content filtering doesn't impact render performance
- [ ] No memory leaks with modal-based media preview

### Responsive Design

- [ ] All layouts adapt properly to mobile screens
- [ ] Video player maintains aspect ratio across screen sizes
- [ ] Pictures sidebar stacks properly on narrow screens
- [ ] Social media layout remains readable on all devices

## Success Criteria

### Primary Objectives

- [ ] **Social Media**: Single author header, AI summary at top, no show more button
- [ ] **Pictures**: PreviewMediaContent integration, separated multimedia/text content
- [ ] **Videos**: Full-size iframe player, text-only content descriptions
- [ ] **All Layouts**: Maintain existing functionality while fixing specific issues

### Quality Standards

- [ ] Zero regression in ArticleLayout functionality
- [ ] Factory pattern continues to work seamlessly
- [ ] All existing media handling features preserved
- [ ] Mobile responsive design maintained across layouts
- [ ] Performance impact minimal (under 5% bundle increase)

### User Experience Goals

- [ ] Cleaner social media content display without duplication
- [ ] Better large-screen video viewing experience
- [ ] Sophisticated image preview with PreviewMediaContent modal
- [ ] Consistent author information display patterns
- [ ] Improved content organization with AI summaries positioned logically

## Risk Mitigation

### Potential Issues

#### Component Dependencies

**Risk**: Changes to shared components (VideoPlayer, ContentBody) could affect other areas
**Mitigation**:

- Add new props with default values to maintain backward compatibility
- Test all existing entry list item displays
- Use feature flags if needed for gradual rollout

#### PreviewMediaContent Integration

**Risk**: Modal-based media preview might conflict with existing modal systems
**Mitigation**:

- Test modal stacking behavior thoroughly
- Ensure proper cleanup of modal state
- Verify keyboard navigation continues to work

#### Performance Impact

**Risk**: Additional modal components and media filtering might impact performance
**Mitigation**:

- Implement lazy loading for PreviewMediaContent modal
- Use React.memo for expensive components
- Profile render performance before and after changes

### Rollback Strategy

- Maintain existing layout components as backup
- Use git feature branches for each layout fix
- Implement progressive enhancement approach
- Test each layout individually before combining changes

## Additional Considerations

### Accessibility

- Ensure all interactive elements have proper ARIA labels
- Maintain keyboard navigation for new modal interactions
- Preserve screen reader compatibility for author headers
- Test video player controls with assistive technologies

### i18n Support

- All new text elements properly localized
- Layout adjustments tested with longer text languages
- RTL language support maintained
- Consistent translation keys across layout components

### Future Extensibility

- Pattern established for other media types (Audio layout)
- Plugin system compatibility maintained
- Theme system integration preserved
- Component reusability across different layout contexts

## Confidence Score: 9/10

This PRP provides a comprehensive fix approach with:

- ✅ **Specific Issue Analysis**: Detailed examination of exact problems and file locations
- ✅ **Targeted Solutions**: Precise fixes for each identified issue without over-engineering
- ✅ **Existing Pattern Leverage**: Uses proven components and patterns already in codebase
- ✅ **External Research**: Incorporates best practices for responsive video and content filtering
- ✅ **Implementation Roadmap**: Clear phase-based approach with specific file changes
- ✅ **Risk Management**: Identified potential issues with concrete mitigation strategies
- ✅ **Comprehensive Testing**: Detailed validation gates and success criteria
- ✅ **Backward Compatibility**: Maintains existing functionality while implementing fixes

High confidence because:

1. **Focused Scope**: Addresses specific reported issues without unnecessary system changes
2. **Proven Components**: Leverages existing PreviewMediaContent, AuthorHeader, and ContentBody components
3. **Pattern Following**: Mimics successful patterns from social-media-item.tsx and other working components
4. **External Validation**: Research confirms best practices for responsive video and content filtering
5. **Minimal Risk**: Changes are contained to specific layout files with clear rollback options

The implementation primarily involves connecting existing working components in better ways rather than building new complex systems, significantly reducing implementation complexity and risk.
