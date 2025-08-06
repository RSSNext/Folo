import * as React from "react"
import { Suspense, useMemo } from "react"

import { MentionDropdown } from "./components/MentionDropdown"
import { DEFAULT_MAX_SUGGESTIONS } from "./constants"
import { useMentionIntegration } from "./hooks/useMentionIntegration"
import { useMentionKeyboard } from "./hooks/useMentionKeyboard"
import { useMentionSearch } from "./hooks/useMentionSearch"
import { useMentionSelection } from "./hooks/useMentionSelection"
import { useMentionTrigger } from "./hooks/useMentionTrigger"
import { MentionNode } from "./MentionNode"
import { defaultTriggerFn } from "./utils/triggerDetection"

export function MentionPlugin() {
  // Get integrated search and context block handling
  const { searchMentions, handleMentionInsert } = useMentionIntegration()

  // Hook for detecting mention triggers
  const { mentionMatch, isActive, clearMentionMatch } = useMentionTrigger({
    triggerFn: defaultTriggerFn,
  })

  // Hook for searching mentions
  const {
    suggestions,
    selectedIndex,
    isLoading,
    searchMentions: performSearch,
    clearSuggestions,
    setSelectedIndex,
    hasResults,
  } = useMentionSearch({
    onSearch: searchMentions,
    maxSuggestions: DEFAULT_MAX_SUGGESTIONS,
  })

  // Hook for handling mention selection
  const { selectMention } = useMentionSelection({
    mentionMatch,
    onMentionInsert: handleMentionInsert,
    onSelectionComplete: () => {
      clearMentionMatch()
      clearSuggestions()
    },
  })

  // Hook for keyboard navigation
  const handleArrowKey = React.useCallback(
    (isUp: boolean) => {
      if (!hasResults) return

      const newIndex = isUp
        ? selectedIndex <= 0
          ? suggestions.length - 1
          : selectedIndex - 1
        : selectedIndex >= suggestions.length - 1
          ? 0
          : selectedIndex + 1

      setSelectedIndex(newIndex)
    },
    [hasResults, suggestions.length, selectedIndex, setSelectedIndex],
  )

  const handleEnterKey = React.useCallback(() => {
    if (hasResults && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const mention = suggestions[selectedIndex]
      if (mention) {
        selectMention(mention)
      }
    }
  }, [hasResults, selectedIndex, suggestions, selectMention])

  const handleEscapeKey = React.useCallback(() => {
    clearMentionMatch()
    clearSuggestions()
  }, [clearMentionMatch, clearSuggestions])

  useMentionKeyboard({
    isActive,
    suggestions,
    selectedIndex,
    onArrowKey: handleArrowKey,
    onEnterKey: handleEnterKey,
    onEscapeKey: handleEscapeKey,
  })

  // Search when mention match changes
  React.useEffect(() => {
    if (mentionMatch) {
      performSearch(mentionMatch.matchingString)
    } else {
      clearSuggestions()
    }
  }, [mentionMatch, performSearch, clearSuggestions])

  // Calculate dropdown props
  const dropdownProps = useMemo(() => {
    if (!isActive || !hasResults) return null

    return {
      isVisible: true,
      suggestions,
      selectedIndex,
      isLoading,
      onSelect: selectMention,
      onClose: handleEscapeKey,
      query: mentionMatch?.matchingString || "",
    }
  }, [
    isActive,
    hasResults,
    suggestions,
    selectedIndex,
    isLoading,
    selectMention,
    handleEscapeKey,
    mentionMatch,
  ])

  return dropdownProps ? (
    <Suspense fallback={null}>
      <MentionDropdown {...dropdownProps} />
    </Suspense>
  ) : null
}

MentionPlugin.id = "mention"
MentionPlugin.nodes = [MentionNode]
