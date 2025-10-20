import * as React from "react"
import { Suspense, useMemo } from "react"

import { ShortcutDropdown } from "./components/ShortcutDropdown"
import { DEFAULT_MAX_SHORTCUT_SUGGESTIONS } from "./constants"
import { useShortcutKeyboard } from "./hooks/useShortcutKeyboard"
import { useShortcutSearch } from "./hooks/useShortcutSearch"
import { useShortcutSearchService } from "./hooks/useShortcutSearchService"
import { useShortcutSelection } from "./hooks/useShortcutSelection"
import { useShortcutTrigger } from "./hooks/useShortcutTrigger"
import { ShortcutNode } from "./ShortcutNode"

export function ShortcutPlugin() {
  const { searchShortcuts } = useShortcutSearchService()

  const { shortcutMatch, isActive, clearShortcutMatch } = useShortcutTrigger()

  const {
    suggestions,
    selectedIndex,
    isLoading,
    searchShortcuts: performSearch,
    clearSuggestions,
    setSelectedIndex,
    hasResults,
  } = useShortcutSearch({
    onSearch: searchShortcuts,
    maxSuggestions: DEFAULT_MAX_SHORTCUT_SUGGESTIONS,
  })

  const { selectShortcut } = useShortcutSelection({
    shortcutMatch,
    onSelectionComplete: () => {
      clearShortcutMatch()
      clearSuggestions()
    },
  })

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
      const shortcut = suggestions[selectedIndex]
      if (shortcut) {
        selectShortcut(shortcut)
      }
    }
  }, [hasResults, selectedIndex, suggestions, selectShortcut])

  const handleEscapeKey = React.useCallback(() => {
    clearShortcutMatch()
    clearSuggestions()
  }, [clearShortcutMatch, clearSuggestions])

  useShortcutKeyboard({
    isActive,
    suggestions,
    selectedIndex,
    onArrowKey: handleArrowKey,
    onEnterKey: handleEnterKey,
    onEscapeKey: handleEscapeKey,
  })

  React.useEffect(() => {
    if (shortcutMatch) {
      performSearch(shortcutMatch.matchingString)
    } else {
      clearSuggestions()
    }
  }, [shortcutMatch, performSearch, clearSuggestions])

  const dropdownProps = useMemo(() => {
    if (!isActive || !hasResults) return null

    return {
      isVisible: true,
      suggestions,
      selectedIndex,
      isLoading,
      onSetSelectIndex: setSelectedIndex,
      onSelect: selectShortcut,
      onClose: handleEscapeKey,
      query: shortcutMatch?.matchingString || "",
    }
  }, [
    isActive,
    hasResults,
    suggestions,
    selectedIndex,
    isLoading,
    setSelectedIndex,
    selectShortcut,
    handleEscapeKey,
    shortcutMatch?.matchingString,
  ])

  return dropdownProps ? (
    <Suspense fallback={null}>
      <ShortcutDropdown {...dropdownProps} />
    </Suspense>
  ) : null
}

ShortcutPlugin.id = "shortcut"
ShortcutPlugin.nodes = [ShortcutNode]
