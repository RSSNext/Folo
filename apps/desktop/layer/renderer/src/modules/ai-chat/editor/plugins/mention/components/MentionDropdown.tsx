import { cn, thenable } from "@follow/utils"
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { TypeaheadGroup } from "../../shared/components/TypeaheadDropdown"
import { TypeaheadDropdown } from "../../shared/components/TypeaheadDropdown"
import { MENTION_TRIGGER_PATTERN } from "../constants"
import { getDateMentionDisplayName } from "../hooks/dateMentionUtils"
import type { MentionData } from "../types"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionDropdownProps {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (mention: MentionData) => void
  onSetSelectIndex: (index: number) => void
  onClose: () => void
  query: string
  anchor?: HTMLElement | null
  showSearchInput?: boolean
  onQueryChange?: (query: string) => void
}

const MentionSuggestionItem = React.memo(
  ({
    mention,
    isSelected,
    onClick,
    query,
    ...props
  }: {
    mention: MentionData
    isSelected: boolean
    onClick: (mention: MentionData) => void
    query: string
  } & Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">) => {
    const { t, i18n } = useTranslation("ai")
    const language = i18n.language || i18n.resolvedLanguage || "en"

    const displayName = React.useMemo(() => {
      if (mention.type === "date") {
        return getDateMentionDisplayName(mention, t, language)
      }
      return mention.name
    }, [mention, t, language])

    const handleClick = useCallback(() => {
      onClick(mention)
    }, [mention, onClick])

    // Highlight matching text
    const highlightText = (text: string, rawQuery: string) => {
      const cleanQuery = rawQuery.replace(MENTION_TRIGGER_PATTERN, "").toLowerCase()
      if (!cleanQuery) return text

      const parts = text.split(new RegExp(`(${cleanQuery})`, "gi"))
      return parts.map((part, index) => {
        const isMatch = part.toLowerCase() === cleanQuery

        if (!part) {
          return null
        }

        return (
          <span
            key={`${mention.id}-${index}`}
            className={isMatch ? "font-semibold text-text-vibrant" : ""}
          >
            {part}
          </span>
        )
      })
    }

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
        {/* Icon */}
        <span className="mr-1.5 inline-flex size-4 items-center justify-center">
          <MentionTypeIcon type={mention.type} value={mention.value} />
        </span>

        {/* Content */}
        <span className="flex-1 truncate">{highlightText(displayName, query)}</span>
      </div>
    )
  },
)

MentionSuggestionItem.displayName = "MentionSuggestionItem"

const MentionGroupHeader = React.memo(({ type }: { type: MentionData["type"] }) => {
  const { t } = useTranslation("ai")

  const label = useMemo(() => {
    switch (type) {
      case "date": {
        return t("mentions.section.date")
      }
      case "entry": {
        return t("mentions.section.entry")
      }
      case "feed": {
        return t("mentions.section.feed")
      }
      case "category": {
        return t("mentions.section.category")
      }
      case "view": {
        return t("mentions.section.view")
      }
      default: {
        return ""
      }
    }
  }, [type, t])

  return (
    <div className="mb-1 mt-2 px-2.5 text-xs font-medium text-text-tertiary first:mt-0">
      {label}
    </div>
  )
})

MentionGroupHeader.displayName = "MentionGroupHeader"

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  isLoading,
  onSelect,
  onSetSelectIndex,
  onClose,
  query,
  anchor,
  showSearchInput = false,
  onQueryChange,
}) => {
  if (!isVisible) throw thenable

  // Group suggestions by type with stable ordering
  const groupedSuggestions = useMemo<TypeaheadGroup<MentionData, MentionData["type"]>[]>(() => {
    const groupMap = new Map<MentionData["type"], MentionData[]>()

    // Group mentions by type
    for (const mention of suggestions) {
      const items = groupMap.get(mention.type)
      if (items) {
        items.push(mention)
      } else {
        groupMap.set(mention.type, [mention])
      }
    }

    // Define stable type order
    const typeOrder: MentionData["type"][] = ["view", "date", "category", "feed", "entry"]

    // Convert to array with stable ordering
    return typeOrder
      .map((type) => {
        const items = groupMap.get(type)
        return items?.length ? { key: type, items } : null
      })
      .filter((group): group is TypeaheadGroup<MentionData, MentionData["type"]> => group !== null)
  }, [suggestions])

  return (
    <TypeaheadDropdown<MentionData, MentionData["type"]>
      isVisible={isVisible}
      items={groupedSuggestions}
      selectedIndex={selectedIndex}
      isLoading={isLoading}
      onSelect={onSelect}
      onSetSelectIndex={onSetSelectIndex}
      onClose={onClose}
      query={query}
      ariaLabel="Mention suggestions"
      getKey={(mention) => `${mention.type}-${mention.id}`}
      renderItem={(mention, _index, isSelected, handlers) => (
        <MentionSuggestionItem
          mention={mention}
          isSelected={isSelected}
          onMouseMove={handlers.onMouseMove}
          onClick={() => handlers.onClick()}
          query={query}
        />
      )}
      renderGroupHeader={(groupKey) => <MentionGroupHeader type={groupKey} />}
      anchor={anchor}
      showSearchInput={showSearchInput}
      onQueryChange={onQueryChange}
    />
  )
}

MentionDropdown.displayName = "MentionDropdown"
