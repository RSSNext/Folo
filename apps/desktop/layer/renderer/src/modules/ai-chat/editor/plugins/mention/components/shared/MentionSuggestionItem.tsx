import { cn } from "@follow/utils"
import * as React from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { MENTION_TRIGGER_PATTERN } from "../../constants"
import { RANGE_WITH_LABEL_KEY } from "../../hooks/dateMentionConfig"
import { getDateMentionDisplayName } from "../../hooks/dateMentionUtils"
import type { MentionData } from "../../types"
import { MentionTypeIcon } from "./MentionTypeIcon"

interface MentionSuggestionItemProps {
  mention: MentionData
  isSelected: boolean
  onClick: (mention: MentionData) => void
  query: string
  /**
   * If true, applies MENTION_TRIGGER_PATTERN to clean the query
   * Set to false for manual mention dropdowns that don't use @ prefix
   */
  cleanQueryWithPattern?: boolean
}

export const MentionSuggestionItem = React.memo<
  MentionSuggestionItemProps & Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">
>(({ mention, isSelected, onClick, query, cleanQueryWithPattern = true, ...props }) => {
  const { t, i18n } = useTranslation("ai")
  const language = i18n.language || i18n.resolvedLanguage || "en"

  const displayName = React.useMemo(() => {
    if (mention.type === "date") {
      return getDateMentionDisplayName(mention, t, language, RANGE_WITH_LABEL_KEY)
    }
    return mention.name
  }, [mention, t, language])

  const handleClick = useCallback(() => {
    onClick(mention)
  }, [mention, onClick])

  // Highlight matching text
  const highlightText = (text: string, rawQuery: string) => {
    const cleanQuery = cleanQueryWithPattern
      ? rawQuery.replace(MENTION_TRIGGER_PATTERN, "").toLowerCase()
      : rawQuery.toLowerCase()

    if (!cleanQuery) return text

    const parts = text.split(new RegExp(`(${cleanQuery})`, "gi"))
    return parts.map((part) => {
      const isMatch = part.toLowerCase() === cleanQuery

      if (!part) {
        return null
      }

      return (
        <span
          key={`${mention.id}-${part}`}
          className={isMatch ? "text-text-vibrant font-semibold" : ""}
        >
          {part}
        </span>
      )
    })
  }

  return (
    <div
      className={cn(
        "cursor-menu relative flex select-none items-center rounded-[5px] px-2.5 py-1 outline-none",
        "focus-within:outline-transparent",
        "data-[highlighted]:bg-theme-selection-hover focus:bg-theme-selection-active focus:text-theme-selection-foreground data-[highlighted]:text-theme-selection-foreground",
        "h-[28px]",
        isSelected && "bg-theme-selection-active text-theme-selection-foreground",
      )}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
      {...props}
    >
      {/* Icon */}
      <span
        className={cn(
          "mr-1.5 inline-flex size-4 items-center justify-center",
          mention.type === "entry" && "text-blue-500",
          mention.type === "feed" && "text-orange-500",
          mention.type === "category" && "text-green-500",
          mention.type === "date" && "text-purple-500",
        )}
      >
        <MentionTypeIcon type={mention.type} value={mention.value} />
      </span>

      {/* Content */}
      <span className="flex-1 truncate">{highlightText(displayName, query)}</span>

      {/* Selection Indicator */}
      {isSelected && (
        <span className="ml-1.5 inline-flex size-4 items-center justify-center">
          <i className="i-mgc-check-cute-re size-3" />
        </span>
      )}
    </div>
  )
})

MentionSuggestionItem.displayName = "MentionSuggestionItem"
