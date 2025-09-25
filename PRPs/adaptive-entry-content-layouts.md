# PRP: Adaptive Entry Content Layouts for Different Media Types

## Overview

Transform the entry content display system from a fixed, article-centric layout to an adaptive system that renders different layouts optimized for specific media types (Social Media, Pictures, Videos, Articles). This will provide media-appropriate viewing experiences that match popular platform conventions while leveraging existing component patterns from the entry list items.

## Current Implementation Analysis

### Current Architecture

- **Fixed Entry Content Layout**: `EntryContent.tsx` uses article-centric structure: Header → Title → AI Summary → Content Body → Attachments → Support Creator
- **Entry List Differentiation**: Entry list items already have adaptive layouts via `getItemComponentByView()` mapping
- **View-Type System**: `FeedViewType` enum defines Articles, SocialMedia, Pictures, Videos, Audios, Notifications
- **Template System**: GridItemTemplate and ListItemTemplate provide consistent patterns for different view types

### Current Entry Content Structure

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/entry-content/EntryContent.tsx`

```typescript
// Current fixed structure for all entry types
<div className="relative flex h-full flex-col">
  <EntryHeader />
  <EntryTitle />           // Prominent title display
  <AISummary />           // AI-generated summary
  <EntryContentHTMLRenderer /> // Main content
  <EntryAttachments />    // File attachments
</div>
```

### Existing Adaptive Patterns in Entry List Items

#### Social Media Item Pattern (`social-media-item.tsx`)

- **Layout**: Avatar left, content right with author name → content → media gallery
- **Content Handling**: Collapsible content with "show more", minimal title prominence
- **Media**: Adaptive gallery (horizontal vs grid based on aspect ratios)

#### Picture Item Pattern (`picture-item.tsx`)

- **Layout**: Image carousel with footer metadata
- **Media**: SwipeMedia component for multiple images, masonry layout support
- **Content**: Author info and metadata in footer

#### Video Item Pattern (`video-item.tsx`)

- **Layout**: Video player/thumbnail → author/title → description
- **Media**: Preview on hover, modal video player, duration overlay
- **Content**: Title and description below video

### Current Limitations

1. **EntryContent ignores view type**: All entries use identical article layout regardless of `feedViewType`
2. **Poor UX for non-article content**: Social media posts show unnecessary titles, videos buried in text
3. **Unused adaptive patterns**: Entry list items have perfect media layouts that aren't leveraged in content view
4. **Inconsistent experience**: Different UX between entry list (adaptive) and entry content (fixed)

## Proposed Solution

### Architecture Changes

Create an adaptive entry content system that selects appropriate layout components based on `FeedViewType`, leveraging existing patterns from entry list items while optimizing for full content display.

### Component Factory Pattern

Use factory pattern to dynamically select layout components:

```typescript
const EntryContentLayoutFactory = {
  [FeedViewType.Articles]: ArticleLayout,
  [FeedViewType.SocialMedia]: SocialMediaLayout,
  [FeedViewType.Pictures]: PicturesLayout,
  [FeedViewType.Videos]: VideosLayout,
  [FeedViewType.Audios]: AudioLayout,
  [FeedViewType.Notifications]: ArticleLayout, // fallback
}
```

### Layout-Specific Components

#### 1. SocialMediaLayout

**Pattern**: Based on `social-media-item.tsx` but optimized for full content view

```typescript
// Layout: Avatar + Author Info + Content + Media Gallery
<div className="flex gap-3 p-4">
  <FeedIcon /> {/* Author avatar */}
  <div className="flex-1">
    <AuthorHeader /> {/* Author name, handle, timestamp */}
    <ContentBody />  {/* Social media content */}
    <MediaGallery /> {/* Adaptive image/video gallery */}
    <AISummary />    {/* AI summary if available */}
  </div>
</div>
```

#### 2. PicturesLayout

**Pattern**: Based on `picture-item.tsx` and `PreviewMediaContent.tsx`

```typescript
// Layout: Image Carousel + Sidebar with metadata
<div className="flex h-full">
  <div className="flex-1"> {/* Image area */}
    <SwipeMediaCarousel />
  </div>
  <div className="w-80 border-l"> {/* Sidebar */}
    <AuthorHeader />
    <EntryTitle />
    <ContentBody />
    <AISummary />
  </div>
</div>
```

#### 3. VideosLayout

**Pattern**: Based on `video-item.tsx` but full-sized

```typescript
// Layout: Video Player + Title/Description below
<div className="flex flex-col h-full">
  <div className="aspect-video"> {/* Video area */}
    <VideoPlayer />
  </div>
  <div className="flex-1 p-4"> {/* Content area */}
    <AuthorHeader />
    <EntryTitle />
    <ContentBody />
    <AISummary />
  </div>
</div>
```

#### 4. ArticleLayout (Current)

**Pattern**: Keep existing layout for articles

```typescript
// Current article structure preserved
<EntryHeader />
<EntryTitle />
<AISummary />
<EntryContentHTMLRenderer />
<EntryAttachments />
```

## Implementation Tasks

### Phase 1: Core Architecture Setup

#### 1. Create Layout Factory System

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/factory.ts`

```typescript
export const getEntryContentLayout = (viewType: FeedViewType) => {
  return EntryContentLayoutFactory[viewType] || ArticleLayout
}
```

#### 2. Create Base Layout Components

**Files**:

- `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/SocialMediaLayout.tsx`
- `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/PicturesLayout.tsx`
- `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/VideosLayout.tsx`
- `apps/desktop/layer/renderer/src/modules/entry-content/components/layouts/ArticleLayout.tsx`

#### 3. Update EntryContent Component

**File**: `apps/desktop/layer/renderer/src/modules/entry-content/components/entry-content/EntryContent.tsx`

```typescript
// Replace fixed layout with factory-based selection
const LayoutComponent = getEntryContentLayout(entry.feedViewType)
return <LayoutComponent entry={entry} />
```

### Phase 2: Layout Implementation

#### 4. Implement SocialMediaLayout

- Extract author display logic from `social-media-item.tsx`
- Implement adaptive media gallery
- Handle collapsible content with proper full-view sizing
- Reference: Twitter-like layout patterns

#### 5. Implement PicturesLayout

- Integrate `SwipeMedia` component for image carousel
- Create sidebar layout for metadata
- Handle single vs multiple images
- Reference: Instagram-like layout patterns

#### 6. Implement VideosLayout

- Integrate video player functionality from `video-item.tsx`
- Add video controls and duration display
- Layout title/description below video
- Reference: YouTube-like layout patterns

#### 7. Extract ArticleLayout

- Move current `EntryContent` structure to dedicated `ArticleLayout`
- Ensure no regression in article viewing experience

### Phase 3: Shared Components

#### 8. Create Shared UI Components

- `AuthorHeader`: Consistent author display (avatar, name, timestamp)
- `ContentBody`: Adaptive content rendering with markdown support
- `MediaGallery`: Reusable media gallery component
- `VideoPlayer`: Consistent video player wrapper

#### 9. Update Entry Context Provider

- Ensure entry context includes `feedViewType` information
- Add layout-specific metadata handling

### Phase 4: Testing & Polish

#### 10. Responsive Design Implementation

- Mobile layouts for each media type
- Tablet adaptations
- Handle edge cases (missing media, long content)

#### 11. Animation & Transitions

- Smooth layout transitions when switching between entries
- Media loading states and placeholders
- Maintain existing animation patterns

## Context & References

### Existing Codebase Patterns

- **Entry List Items**: `apps/desktop/layer/renderer/src/modules/entry-column/Items/` - Perfect reference patterns
- **Media Components**: `SwipeMedia`, `PreviewMediaContent`, `Media` - Reusable media handling
- **Template System**: `GridItemTemplate` - Consistent footer patterns
- **View Type System**: `getItemComponentByView()` - Proven factory pattern implementation

### External Documentation & Best Practices

- **Factory Pattern**: https://dev.to/moayad523/stop-using-conditional-rendering-leveraging-the-factory-pattern-for-dynamic-component-creation-740
- **React Conditional Rendering**: https://react.dev/learn/conditional-rendering
- **Switch Pattern**: https://dev.to/musatov/conditional-rendering-in-react-with-a-switch-component-23ph
- **Social Media Layouts**: https://github.com/thisisadityarao/react-social-media-cards
- **Instagram Layout Patterns**: https://github.com/natividadesusana/instagram-layout-react
- **Adaptive Design**: https://www.interaction-design.org/literature/topics/adaptive-design
- **React Social Media Embed**: https://www.npmjs.com/package/react-social-media-embed

### UI Reference Platforms

- **Social Media**: Twitter's post layout with avatar, author info, and content
- **Pictures**: Instagram's image carousel with sidebar metadata
- **Videos**: YouTube's video player with title/description below
- **Articles**: Current Follow article layout (preserve existing UX)

## Validation Gates

### Code Quality

```bash
# TypeScript validation
pnpm run typecheck

# Linting
pnpm run lint:tsl
pnpm run lint

# Format validation
pnpm run format

# Build validation
pnpm run build:web
```

### Functional Testing

```bash
# Manual testing checklist
1. Social Media entries → Avatar left, content right, proper media gallery
2. Picture entries → Image carousel + sidebar metadata, multiple image handling
3. Video entries → Video player + title/description below, controls work
4. Article entries → No regression, identical to current layout
5. Mixed feed → Layout switches appropriately between entry types
6. Mobile responsive → All layouts adapt properly to mobile screens
7. Media loading → Proper loading states and error handling
```

### Performance Validation

- Bundle size impact analysis (should be minimal due to code splitting)
- Layout shift measurement (should be zero)
- Media loading performance maintained
- Memory usage with multiple media types

## Success Criteria

- [ ] Social media entries display with Twitter-like layout (avatar + author + content)
- [ ] Picture entries display with Instagram-like layout (carousel + sidebar)
- [ ] Video entries display with YouTube-like layout (player + title below)
- [ ] Article entries maintain identical current layout
- [ ] Factory pattern correctly selects layout based on `FeedViewType`
- [ ] All existing functionality preserved (AI summary, attachments, etc.)
- [ ] Mobile responsive design works across all layouts
- [ ] No performance regression in entry switching
- [ ] No bundle size increase over 5%
- [ ] All media loading states properly handled

## Risk Mitigation

### Potential Issues

1. **Layout Complexity**: Different layouts might conflict with existing entry content container sizing
2. **Media Loading**: Complex media components might impact performance
3. **Mobile Responsiveness**: Desktop-optimized layouts might break on mobile
4. **Bundle Size**: Adding multiple layout components could increase bundle size
5. **Component Dependencies**: Shared components might have circular dependencies

### Mitigation Strategies

1. **Container Isolation**: Use CSS containment and absolute positioning where needed
2. **Lazy Loading**: Implement code splitting for layout components
3. **Mobile-First**: Design mobile layouts first, then enhance for desktop
4. **Bundle Analysis**: Use webpack-bundle-analyzer to monitor size impact
5. **Dependency Management**: Clear component hierarchy and shared utilities in separate files

### Rollback Strategy

- Feature flag implementation to toggle between old and new layouts
- Gradual rollout by `FeedViewType` (start with least-used types)
- Database flag to disable adaptive layouts per user preference

## Additional Considerations

### Accessibility

- Ensure all layouts maintain proper heading hierarchy
- Video players must support keyboard navigation
- Image carousels need proper ARIA labels
- Screen reader compatibility across all layouts

### i18n Support

- All new text elements properly localized
- Layout adjustments for RTL languages
- Consistent translation keys across layouts

### Future Extensibility

- Audio layout placeholder implementation
- Plugin system for custom layout types
- Theme system integration for layout variants

## Confidence Score: 9/10

This PRP provides a comprehensive implementation approach with:

- ✅ **Detailed codebase analysis**: Complete understanding of existing patterns and architecture
- ✅ **Proven patterns**: Leveraging successful entry list item layouts
- ✅ **Factory pattern**: Clean, extensible architecture for layout selection
- ✅ **External research**: Best practices from social media layout implementations
- ✅ **Existing components**: Reusing proven media handling components
- ✅ **Clear implementation path**: Phased approach with specific file references
- ✅ **Risk mitigation**: Identified potential issues with concrete solutions
- ✅ **Executable validation**: Specific testing steps and success criteria

High confidence is justified because:

1. **Existing foundation**: Entry list items already demonstrate successful adaptive patterns
2. **Component reuse**: Media components (`SwipeMedia`, `PreviewMediaContent`) are proven
3. **Clear architecture**: Factory pattern is well-established in the codebase
4. **External validation**: Research confirms best practices align with proposed approach
5. **Minimal breaking changes**: Articles maintain existing layout, reducing regression risk

The main implementation involves connecting existing successful patterns rather than building entirely new systems, significantly reducing complexity and risk.
