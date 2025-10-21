import { cn, thenable } from "@follow/utils"
import * as React from "react"
import { useCallback } from "react"

import { useAISettingValue } from "~/atoms/settings/ai"

import { TypeaheadDropdown } from "../../shared/components/TypeaheadDropdown"
import type { ShortcutData } from "../types"

interface ShortcutDropdownProps {
  isVisible: boolean
  suggestions: ShortcutData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (shortcut: ShortcutData) => void
  onSetSelectIndex: (index: number) => void
  onClose: () => void
  query: string
}

const ShortcutSuggestionItem = React.memo(
  ({
    shortcut,
    isSelected,
    onClick,
    query,
    ...props
  }: {
    shortcut: ShortcutData
    isSelected: boolean
    onClick: (shortcut: ShortcutData) => void
    query: string
  } & Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">) => {
    const handleClick = useCallback(() => {
      onClick(shortcut)
    }, [shortcut, onClick])

    const highlightText = useCallback(
      (text: string, rawQuery: string) => {
        const cleanQuery = rawQuery.replace(/^\//, "").toLowerCase()
        if (!cleanQuery) return text

        const parts = text.split(new RegExp(`(${cleanQuery})`, "gi"))
        return parts.map((part, index) => {
          const isMatch = part.toLowerCase() === cleanQuery

          if (!part) {
            return null
          }

          return (
            <span
              key={`${shortcut.id}-${index}`}
              className={isMatch ? "font-semibold text-text-vibrant" : ""}
            >
              {part}
            </span>
          )
        })
      },
      [shortcut.id],
    )

    const { shortcuts } = useAISettingValue()
    const matched = React.useMemo(() => {
      return shortcuts.find((s) => s.name === shortcut.name)
    }, [shortcuts, shortcut.name])

    return (
      <div
        className={cn(
          "relative flex cursor-menu select-none items-center rounded-[5px] px-2.5 py-1 outline-none",
          "focus-within:outline-transparent",
          "focus:bg-theme-selection-active focus:text-theme-selection-foreground data-[highlighted]:bg-theme-selection-hover data-[highlighted]:text-theme-selection-foreground",
          "h-[28px]",
          isSelected && "bg-theme-selection-active text-theme-selection-foreground",
        )}
        onClick={handleClick}
        role="option"
        aria-selected={isSelected}
        {...props}
      >
        <span className="mr-1.5 inline-flex size-4 items-center justify-center text-blue">
          {matched?.icon ? (
            <i className={cn("text-[16px]", matched.icon)} />
          ) : (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-blue/10 text-xs font-semibold leading-none">
              <i className="i-mgc-hotkey-cute-re" />
            </span>
          )}
        </span>
        <span className="flex-1 truncate leading-tight">{highlightText(shortcut.name, query)}</span>
      </div>
    )
  },
)

ShortcutSuggestionItem.displayName = "ShortcutSuggestionItem"

export const ShortcutDropdown: React.FC<ShortcutDropdownProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  isLoading,
  onSelect,
  onSetSelectIndex,
  onClose,
  query,
}) => {
  if (!isVisible) throw thenable

  return (
    <TypeaheadDropdown
      isVisible={isVisible}
      items={suggestions}
      selectedIndex={selectedIndex}
      isLoading={isLoading}
      onSelect={onSelect}
      onSetSelectIndex={onSetSelectIndex}
      onClose={onClose}
      query={query}
      ariaLabel="Shortcut suggestions"
      getKey={(s) => s.id}
      loadingMessage="Searching..."
      emptyMessage="No shortcuts found"
      emptyHint="Try a different search term"
      renderItem={(shortcut, _index, isSelected, handlers) => (
        <ShortcutSuggestionItem
          key={shortcut.id}
          shortcut={shortcut}
          isSelected={isSelected}
          onMouseMove={handlers.onMouseMove}
          onClick={() => handlers.onClick()}
          query={query}
        />
      )}
    />
  )
}

ShortcutDropdown.displayName = "ShortcutDropdown"
