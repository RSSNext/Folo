# PRP: AI Summary Chat Integration for Enhanced User Engagement

## Overview

Transform the AI chat interface from a static welcome screen to a context-aware, engagement-focused experience by integrating AI summary as initial content. This enhancement automatically displays relevant entry summaries when users open the AI chat panel, providing zero-friction conversation starters and increasing AI feature adoption through progressive disclosure patterns.

## Current Implementation Analysis

### Current Chat Interface Architecture

**File**: `apps/desktop/layer/renderer/src/modules/ai-chat/components/layouts/ChatInterface.tsx`

**Current Flow**:

```typescript
// Conditional rendering based on message state
{!hasMessages && !isLoadingHistory ? (
  <WelcomeScreen onSend={handleSendMessage} />
) : (
  <ScrollArea>
    <Messages />
    {(status === "submitted" || status === "streaming") && <AIChatWaitingIndicator />}
  </ScrollArea>
)}
```

**WelcomeScreen Structure** (`WelcomeScreen.tsx`):

```typescript
// Current static welcome screen
<div className="flex flex-1 flex-col items-center justify-center px-6">
  <div className="w-full max-w-2xl space-y-8">
    <div className="space-y-6 text-center">
      <AISpline />                    // 3D AI model
      <h1>{APP_NAME} AI</h1>          // Title
      <p>{t("welcome_description")}</p> // Description
    </div>
    <div className="relative h-36 max-w-2xl" /> // Empty space
    <div className="relative flex flex-wrap items-center justify-center gap-2">
      {enabledShortcuts.map(...)}      // Quick action shortcuts
      {DEFAULT_SHORTCUTS.map(...)}     // Default suggestions
    </div>
  </div>
</div>
```

### Existing AI Summary System

**Summary Store** (`packages/internal/store/src/modules/summary/store.ts`):

- **Data Structure**: `Record<entryId, Record<language, SummaryData>>`
- **Generation**: `summarySyncService.generateSummary()` with API integration
- **Hooks**: `useSummary()`, `usePrefetchSummary()`, `useSummaryStatus()`
- **Caching**: LRU cleanup with `lastAccessed` tracking

**Visual AISummary Component** (`apps/desktop/layer/renderer/src/modules/entry-content/AISummary.tsx`):

```typescript
// Beautiful glass-morphism design with animations
<div className={cn(
  "group relative my-8 overflow-hidden rounded-2xl border border-neutral-200/50 p-5 backdrop-blur-xl",
  "bg-gradient-to-b from-neutral-50/80 to-white/40 dark:from-neutral-900/80 dark:to-neutral-900/40",
  "dark:border-neutral-800/50",
  summary.isLoading && "animate-pulse with gradient shimmer"
)}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="center relative">
        <i className="i-mgc-ai-cute-re text-lg with glow effect" />
      </div>
      <span className="bg-gradient-to-r bg-clip-text font-medium text-transparent">
        {t("entry_content.ai_summary")}
      </span>
    </div>
    {summary.data && <CopyButton />}
  </div>
  <AutoResizeHeight className="mt-4">
    {summary.isLoading ? <SkeletonLoader /> : <Markdown>{summary.data}</Markdown>}
  </AutoResizeHeight>
</div>
```

### Entry Context Integration

**Already Implemented** (`EntryContent.ai.tsx` lines 89-98):

```typescript
const { addOrUpdateBlock, removeBlock } = useBlockActions()
useEffect(() => {
  addOrUpdateBlock({
    id: BlockSliceAction.SPECIAL_TYPES.mainEntry,
    type: "mainEntry",
    value: entryId,
  })
  return () => {
    removeBlock(BlockSliceAction.SPECIAL_TYPES.mainEntry)
  }
}, [addOrUpdateBlock, entryId, removeBlock])
```

**Entry Context Retrieval** (`EntryPickers.tsx` lines 15-18):

```typescript
const mainEntryId = useAIChatStore()((s) => {
  const block = s.blocks.find((b) => b.type === "mainEntry")
  return block && block.type === "mainEntry" ? block.value : undefined
})
```

### Current Limitations

1. **Zero Context Awareness**: Welcome screen ignores available entry context and summary data
2. **Missed Engagement Opportunity**: Users must initiate conversation without any contextual prompts
3. **Disconnected Experience**: Rich summary data exists but isn't leveraged in chat interface
4. **Static Quick Actions**: Generic shortcuts instead of context-aware conversation starters
5. **Poor Progressive Disclosure**: No smooth transition from passive summary viewing to active conversation

## Proposed Solution

### Architecture Overview

Create a context-aware chat interface that intelligently displays entry summaries as conversation starters while maintaining the existing welcome screen for non-entry contexts. The solution leverages existing summary infrastructure and visual patterns while introducing smart progressive enhancement.

### Component Architecture

```typescript
// Enhanced WelcomeScreen with context awareness
const WelcomeScreen = ({ onSend }: WelcomeScreenProps) => {
  const mainEntryId = useMainEntryId()
  const hasEntryContext = !!mainEntryId

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      {hasEntryContext ? (
        <EntrySummaryWelcome entryId={mainEntryId} onSend={onSend} />
      ) : (
        <DefaultWelcome onSend={onSend} />
      )}
    </div>
  )
}
```

### Core Components

#### 1. EntrySummaryCard Component

**File**: `apps/desktop/layer/renderer/src/modules/ai-chat/components/welcome/EntrySummaryCard.tsx`

**Purpose**: Display entry summary with chat-optimized styling and smart actions

```typescript
interface EntrySummaryCardProps {
  entryId: string
  onSend: (message: string) => void
  className?: string
}

const EntrySummaryCard: React.FC<EntrySummaryCardProps> = ({ entryId, onSend, className }) => {
  const actionLanguage = useActionLanguage()
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const summary = usePrefetchSummary({
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    actionLanguage,
    enabled: true,
  })

  const quickActions = useSmartQuickActions(summary.data, entryId)

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={Spring.presets.smooth}
      className={cn(
        // Reuse AISummary visual patterns but optimized for chat context
        "group relative w-full max-w-2xl overflow-hidden rounded-2xl border p-6 backdrop-blur-xl",
        "bg-gradient-to-b from-neutral-50/80 to-white/40 dark:from-neutral-900/80 dark:to-neutral-900/40",
        "border-neutral-200/50 dark:border-neutral-800/50",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        summary.isLoading && "before:animate-shimmer",
        className
      )}
    >
      {/* Header with entry context */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="i-mgc-ai-cute-re text-lg text-purple-600 dark:text-purple-400" />
            <div className="absolute inset-0 rounded-full blur-sm bg-purple-400/20 animate-pulse" />
          </div>
          <div>
            <h3 className="font-medium text-text">AI Summary</h3>
            <p className="text-xs text-text-secondary">Ready to discuss this entry</p>
          </div>
        </div>
        <EntryQuickInfo entryId={entryId} />
      </div>

      {/* Summary Content */}
      <AutoResizeHeight className="mb-6" spring>
        {summary.isLoading ? (
          <SummaryLoadingState />
        ) : summary.data ? (
          <div className="space-y-3">
            <Markdown className="prose-sm prose-p:m-0 max-w-none text-text-secondary leading-relaxed">
              {String(summary.data)}
            </Markdown>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="i-mgc-document-cute-re text-2xl text-text-tertiary mb-2" />
            <p className="text-sm text-text-secondary">Summary not available</p>
          </div>
        )}
      </AutoResizeHeight>

      {/* Smart Quick Actions */}
      {summary.data && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Ask about this entry
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <m.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, ...Spring.presets.snappy }}
                onClick={() => onSend(action.prompt)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  "bg-material-medium hover:bg-material-thick",
                  "border border-border/50 hover:border-border",
                  "text-text-secondary hover:text-text",
                  "hover:shadow-sm active:scale-95"
                )}
              >
                <i className={`${action.icon} text-xs`} />
                {action.label}
              </m.button>
            ))}
          </div>
        </div>
      )}
    </m.div>
  )
}
```

#### 2. Smart Quick Actions Generator

**File**: `apps/desktop/layer/renderer/src/modules/ai-chat/hooks/useSmartQuickActions.ts`

**Purpose**: Generate contextual conversation starters based on summary content and entry metadata

```typescript
interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: string
  priority: number
}

export const useSmartQuickActions = (
  summaryData: string | null,
  entryId: string,
): QuickAction[] => {
  const entry = useEntry(entryId)
  const { t } = useTranslation("ai")

  return useMemo(() => {
    if (!summaryData || !entry) return DEFAULT_ENTRY_ACTIONS

    const actions: QuickAction[] = []

    // Content-based actions
    if (summaryData.length > 500) {
      actions.push({
        id: "simplify",
        label: t("quick_actions.simplify"),
        prompt: `Can you simplify this summary in 2-3 sentences? Focus on the main points.`,
        icon: "i-mgc-edit-cute-re",
        priority: 1,
      })
    }

    // Entry type-based actions
    if (entry.url) {
      actions.push({
        id: "discuss",
        label: t("quick_actions.discuss"),
        prompt: `What are the key insights from this article? What should I know?`,
        icon: "i-mgc-chat-cute-re",
        priority: 2,
      })
    }

    // Always available actions
    actions.push(
      {
        id: "questions",
        label: t("quick_actions.questions"),
        prompt: `What questions should I be asking about this content?`,
        icon: "i-mgc-question-cute-re",
        priority: 3,
      },
      {
        id: "takeaways",
        label: t("quick_actions.takeaways"),
        prompt: `What are the most important takeaways from this entry?`,
        icon: "i-mgc-star-cute-re",
        priority: 4,
      },
    )

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 4)
  }, [summaryData, entry, t])
}

const DEFAULT_ENTRY_ACTIONS: QuickAction[] = [
  {
    id: "analyze",
    label: "Analyze this entry",
    prompt: "Can you analyze this entry and tell me what it's about?",
    icon: "i-mgc-search-cute-re",
    priority: 1,
  },
  {
    id: "explain",
    label: "Explain key points",
    prompt: "What are the key points I should understand from this entry?",
    icon: "i-mgc-lightbulb-cute-re",
    priority: 2,
  },
]
```

#### 3. Enhanced WelcomeScreen with Context Awareness

**File**: `apps/desktop/layer/renderer/src/modules/ai-chat/components/layouts/WelcomeScreen.tsx` (Modified)

```typescript
export const WelcomeScreen = ({ onSend }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()
  const settingModalPresent = useSettingModal()

  const hasEntryContext = !!mainEntryId
  const hasCustomPrompt = aiSettings.personalizePrompt?.trim()
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header Section - Always Present */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={Spring.presets.smooth}
          className="space-y-6 text-center"
        >
          <div className="mx-auto size-16">
            <AISpline />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-text text-2xl font-semibold">{APP_NAME} AI</h1>
            <p className="text-text-secondary text-balance text-sm">
              {hasEntryContext ? t("welcome_description_contextual") : t("welcome_description")}
            </p>
          </div>
        </m.div>

        {/* Dynamic Content Area */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {hasEntryContext ? (
              <EntrySummaryCard
                key="entry-summary"
                entryId={mainEntryId}
                onSend={onSend}
              />
            ) : (
              <DefaultWelcomeContent
                key="default-welcome"
                onSend={onSend}
                shortcuts={enabledShortcuts}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Personal Prompt - Always at Bottom if Present */}
        {hasCustomPrompt && (
          <PersonalPromptDisplay
            prompt={aiSettings.personalizePrompt}
            onEdit={() => settingModalPresent("ai")}
          />
        )}
      </div>
    </div>
  )
}
```

### Data Flow Integration

#### Summary Prefetching Strategy

```typescript
// In ChatInterface.tsx - Prefetch summary when entry context available
const ChatInterfaceContent = () => {
  const hasMessages = useHasMessages()
  const mainEntryId = useMainEntryId()
  const actionLanguage = useActionLanguage()

  // Prefetch summary for context-aware welcome screen
  usePrefetchSummary({
    entryId: mainEntryId || "",
    target: "content", // Start with content, fallback to readability if needed
    actionLanguage,
    enabled: !!mainEntryId && !hasMessages, // Only when showing welcome screen
  })

  // ... rest of component
}
```

#### State Management Integration

```typescript
// Custom hook for main entry context
export const useMainEntryId = (): string | undefined => {
  return useAIChatStore()((state) => {
    const block = state.blocks.find((b) => b.type === "mainEntry")
    return block && block.type === "mainEntry" ? block.value : undefined
  })
}

// Hook for entry summary in chat context
export const useEntrySummaryForChat = (entryId: string) => {
  const actionLanguage = useActionLanguage()
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)

  return usePrefetchSummary({
    entryId,
    target: isInReadabilitySuccess ? "readabilityContent" : "content",
    actionLanguage,
    enabled: !!entryId,
    staleTime: 1000 * 60 * 60, // 1 hour - summaries don't change often
  })
}
```

### Animation and Visual Design

#### Micro-interactions and Transitions

```typescript
// Smooth transitions between welcome states
const welcomeVariants = {
  entryContext: {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
  },
  defaultWelcome: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.98 },
  },
}

// Quick action button animations
const quickActionVariants = {
  initial: { opacity: 0, scale: 0.9, x: -10 },
  animate: { opacity: 1, scale: 1, x: 0 },
  hover: { scale: 1.02, y: -1 },
  tap: { scale: 0.98 },
}
```

#### Consistent Design Language

- **Glass-morphism**: Reuse AISummary visual patterns with chat-optimized spacing
- **Purple Gradient**: Maintain AI branding with purple accent colors
- **Spring Animations**: Use Spring.presets.smooth for all major transitions
- **Material Colors**: UIKit material colors for consistent depth and hierarchy
- **Responsive Typography**: Scalable text that works across different panel sizes

## Implementation Plan

### Phase 1: Core Functionality (MVP)

#### Tasks (in order):

1. **Create EntrySummaryCard Component**
   - File: `apps/desktop/layer/renderer/src/modules/ai-chat/components/welcome/EntrySummaryCard.tsx`
   - Reuse AISummary visual patterns
   - Basic summary display with loading states
   - Simple click-to-start conversation

2. **Create useMainEntryId Hook**
   - File: `apps/desktop/layer/renderer/src/modules/ai-chat/hooks/useMainEntryId.ts`
   - Extract mainEntry block value from AI chat store
   - Handle undefined/null states gracefully

3. **Modify WelcomeScreen Component**
   - File: `apps/desktop/layer/renderer/src/modules/ai-chat/components/layouts/WelcomeScreen.tsx`
   - Add conditional rendering based on entry context
   - Integrate EntrySummaryCard component
   - Maintain existing functionality for non-entry contexts

4. **Add Summary Prefetching to ChatInterface**
   - File: `apps/desktop/layer/renderer/src/modules/ai-chat/components/layouts/ChatInterface.tsx`
   - Prefetch summary when entry context available
   - Only when welcome screen is showing (no messages)

5. **Basic Smart Quick Actions**
   - File: `apps/desktop/layer/renderer/src/modules/ai-chat/hooks/useSmartQuickActions.ts`
   - Simple content-based action generation
   - Default fallback actions for all entries

6. **Update Translations**
   - Add new translation keys for contextual descriptions
   - Quick action labels and prompts

### Phase 2: UX Optimization

#### Tasks:

7. **Enhanced Smart Quick Actions**
   - Content analysis for intelligent action generation
   - Entry type detection (article, social media, video)
   - Priority-based action sorting

8. **Micro-interaction Animations**
   - Smooth state transitions with AnimatePresence
   - Quick action button hover/tap effects
   - Loading state animations with shimmer effects

9. **Entry Quick Info Component**
   - Display entry metadata (title, source, date)
   - Compact design that doesn't compete with summary
   - Optional component based on space constraints

10. **Responsive Layout Adaptation**
    - Floating panel vs fixed panel optimization
    - Mobile-friendly touch targets
    - Adaptive spacing and typography

### Phase 3: Advanced Features

#### Tasks:

11. **First-time User Guidance**
    - Onboarding tooltip for new feature
    - Progressive disclosure of advanced features
    - User preference learning

12. **Context-aware Optimization**
    - Reading progress integration
    - Related entries suggestions
    - Conversation history awareness

13. **Performance Optimization**
    - Summary caching improvements
    - Lazy loading for non-critical components
    - Bundle size optimization

14. **A/B Testing Integration**
    - Feature flag support
    - Usage analytics
    - Engagement metrics tracking

## Validation Gates

### Code Quality

```bash
# TypeScript compilation
pnpm run typecheck

# Linting
pnpm run lint

# Code formatting
pnpm run format
```

### Testing Strategy

```bash
# Unit tests for new hooks and components
pnpm run test apps/desktop/layer/renderer/src/modules/ai-chat

# Integration tests for summary prefetching
pnpm run test:integration

# E2E tests for chat interaction flows
pnpm run test:e2e -- --grep "AI Chat.*Summary"
```

### Manual Testing Checklist

- [ ] **Entry Context Detection**: AI chat shows summary when viewing an entry
- [ ] **Fallback Behavior**: Default welcome screen when no entry context
- [ ] **Summary Loading**: Proper loading states and error handling
- [ ] **Quick Actions**: Context-appropriate conversation starters
- [ ] **Animations**: Smooth transitions between states
- [ ] **Responsive Design**: Works in both floating and fixed panels
- [ ] **Theme Support**: Proper light/dark mode appearance
- [ ] **Accessibility**: Keyboard navigation and screen reader support

### Performance Metrics

- [ ] **First Paint**: Summary content visible within 300ms
- [ ] **Bundle Impact**: <10KB addition to chat module bundle
- [ ] **Memory Usage**: No memory leaks during context switches
- [ ] **Animation Performance**: 60fps during transitions

## Dependencies and Integration Points

### Existing Systems Integration

- **Summary Store**: `packages/internal/store/src/modules/summary/`
- **Entry Store**: Integration with entry context tracking
- **AI Chat Store**: Block system for entry context management
- **Translation System**: New keys for contextual content
- **Theme System**: UIKit colors and material design consistency

### External Dependencies

- **React Query**: Already used for summary prefetching
- **Framer Motion**: `m.` prefix components for animations
- **i18next**: Translation key expansion
- **Tailwind CSS**: UIKit color classes and material styles

### API Integration

- **Summary Generation**: Existing `/ai/summary` endpoint
- **No new API calls**: Reuses existing summary infrastructure
- **Caching Strategy**: Leverages existing SummaryStore LRU cache

## Risk Assessment & Mitigation

### Technical Risks

1. **Performance Impact** (Low Risk)
   - _Risk_: Summary prefetching could slow chat opening
   - _Mitigation_: Conditional prefetching only when needed, existing cache strategy

2. **Animation Jank** (Medium Risk)
   - _Risk_: Complex animations could affect performance
   - _Mitigation_: Use optimized Framer Motion patterns, test on lower-end devices

3. **State Synchronization** (Low Risk)
   - _Risk_: Entry context out of sync with chat store
   - _Mitigation_: Leverage existing mainEntry block system, tested pattern

### UX Risks

1. **Feature Discoverability** (Medium Risk)
   - _Risk_: Users may not notice the enhanced welcome screen
   - _Mitigation_: Subtle onboarding hints, analytics tracking

2. **Context Mismatch** (Low Risk)
   - _Risk_: Summary doesn't match user expectations
   - _Mitigation_: Clear visual hierarchy, fallback to default actions

3. **Information Overload** (Medium Risk)
   - _Risk_: Too much information in welcome screen
   - _Mitigation_: Progressive disclosure, clean visual design

## Success Metrics

### Engagement Metrics

- **AI Chat Adoption**: 25% increase in chat panel opens from entry context
- **Conversation Initiation**: 40% increase in messages sent from welcome screen
- **Quick Action Usage**: 60% of conversations start with context-aware quick actions
- **Session Duration**: 20% increase in average chat session length

### Performance Metrics

- **Load Time**: Summary content visible within 300ms
- **Error Rate**: <1% failure rate for summary loading
- **Cache Hit Rate**: >80% cache hits for recently viewed entries

### User Satisfaction

- **User Feedback**: Positive sentiment on enhanced chat experience
- **Feature Retention**: 70% of users who try the feature continue using it
- **Support Tickets**: No increase in AI-related support requests

## Future Enhancements

### Short-term (Next Quarter)

- **Multi-language Summary Support**: Leverage existing i18n infrastructure
- **Summary Quality Feedback**: Allow users to rate summary relevance
- **Conversation Templates**: Pre-built conversation flows for common entry types

### Medium-term (Next 6 Months)

- **Cross-entry Conversations**: Enable discussing multiple entries in one chat
- **Smart Follow-ups**: AI-suggested next questions based on conversation context
- **Entry Annotations**: Allow highlighting specific parts of entry for discussion

### Long-term (Next Year)

- **Voice Interaction**: Voice commands for summary-based conversations
- **Collaborative Features**: Share AI conversations about entries
- **Advanced Analytics**: ML-driven insights on conversation patterns

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with:

- ✅ **Detailed Architecture**: Clear component structure and data flow
- ✅ **Existing Pattern Reuse**: Leverages proven AISummary and chat patterns
- ✅ **Phased Implementation**: Incremental delivery with clear milestones
- ✅ **Risk Mitigation**: Identified potential issues with solutions
- ✅ **Testing Strategy**: Comprehensive validation approach
- ✅ **Performance Considerations**: Optimized prefetching and caching
- ✅ **UX Best Practices**: Context-aware design with progressive enhancement
- ✅ **Code Examples**: Realistic implementation snippets with proper patterns
- ✅ **Integration Points**: Clear dependencies and system boundaries
- ✅ **Success Metrics**: Measurable outcomes and validation criteria

The implementation leverages existing, proven infrastructure while introducing meaningful enhancements that align with modern AI chat UX patterns and the application's design system.
