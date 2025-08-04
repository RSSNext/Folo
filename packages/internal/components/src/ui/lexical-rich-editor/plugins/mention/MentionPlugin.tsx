import * as React from "react"
import { useMemo } from "react"

import { MentionDropdown } from "./components/MentionDropdown"
import { DEFAULT_MAX_SUGGESTIONS, DEFAULT_MENTION_TYPES } from "./constants"
import { useMentionKeyboard } from "./hooks/useMentionKeyboard"
import { useMentionSearch } from "./hooks/useMentionSearch"
import { useMentionSelection } from "./hooks/useMentionSelection"
import { useMentionTrigger } from "./hooks/useMentionTrigger"
import type { MentionPluginProps } from "./types"

export function MentionPlugin({
  onSearch,

  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  triggerFn,
  onMentionInsert,
}: MentionPluginProps) {
  // Hook for detecting mention triggers
  const { mentionMatch, isActive, clearMentionMatch } = useMentionTrigger({
    triggerFn,
  })

  // Hook for searching mentions
  const {
    suggestions,
    selectedIndex,
    isLoading,
    searchMentions,
    clearSuggestions,
    setSelectedIndex,
    hasResults,
  } = useMentionSearch({
    onSearch,
    maxSuggestions,
  })

  // Hook for handling mention selection
  const { selectMention } = useMentionSelection({
    mentionMatch,
    onMentionInsert,
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
      searchMentions(mentionMatch.matchingString)
    } else {
      clearSuggestions()
    }
  }, [mentionMatch, searchMentions, clearSuggestions])

  // Calculate dropdown props
  const dropdownProps = useMemo(() => {
    if (!isActive || !hasResults) return null

    return {
      isVisible: true,
      suggestions,
      selectedIndex,
      isLoading,
      onSelect: selectMention,
      query: mentionMatch?.matchingString || "",
    }
  }, [isActive, hasResults, suggestions, selectedIndex, isLoading, selectMention, mentionMatch])

  return dropdownProps ? <MentionDropdown {...dropdownProps} /> : null
}
