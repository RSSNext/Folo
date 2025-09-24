import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { cn, thenable } from "@follow/utils"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { MENTION_TRIGGER_PATTERN } from "../constants"
import type { MentionData } from "../types"
import { calculateDropdownPosition } from "../utils/positioning"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionDropdownProps {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (mention: MentionData) => void
  onClose: () => void
  query: string
  anchor?: HTMLElement | null
}

const MentionSuggestionItem = React.memo(
  ({
    mention,
    isSelected,
    onClick,
    query,
  }: {
    mention: MentionData
    isSelected: boolean
    onClick: (mention: MentionData) => void
    query: string
  }) => {
    const handleClick = useCallback(() => {
      onClick(mention)
    }, [mention, onClick])

    // Highlight matching text
    const highlightText = (text: string, query: string) => {
      const cleanQuery = query.replace(MENTION_TRIGGER_PATTERN, "").toLowerCase()
      if (!cleanQuery) return text

      const parts = text.split(new RegExp(`(${cleanQuery})`, "gi"))
      return parts.map((part) => {
        const isMatch = part.toLowerCase() === cleanQuery

        return (
          <span key={mention.id} className={isMatch ? "text-text-vibrant font-semibold" : ""}>
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
      >
        {/* Icon */}
        <span
          className={cn(
            "mr-1.5 inline-flex size-4 items-center justify-center",
            mention.type === "entry" && "text-blue-500",
            mention.type === "feed" && "text-orange-500",
          )}
        >
          <MentionTypeIcon type={mention.type} />
        </span>

        {/* Content */}
        <span className="flex-1 truncate">{highlightText(mention.name, query)}</span>

        {/* Selection Indicator */}
        {isSelected && (
          <span className="ml-1.5 inline-flex size-4 items-center justify-center">
            <i className="i-mgc-check-cute-re size-3" />
          </span>
        )}
      </div>
    )
  },
)

MentionSuggestionItem.displayName = "MentionSuggestionItem"

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  isLoading,
  onSelect,
  onClose,
  query,
}) => {
  if (!isVisible) throw thenable

  const [editor] = useLexicalComposerContext()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [referenceWidth, setReferenceWidth] = useState<number>(320)

  // Create virtual reference element based on cursor position
  const virtualReference = useRef({
    getBoundingClientRect: () => {
      const position = calculateDropdownPosition(editor)
      const editorElement = editor.getRootElement()

      if (!position || !editorElement) {
        // Fallback to editor element
        return (
          editorElement?.getBoundingClientRect() || {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
          }
        )
      }

      const editorRect = editorElement.getBoundingClientRect()

      return {
        top: editorRect.top + position.top,
        left: editorRect.left + position.left,
        bottom: editorRect.top + position.top,
        right: editorRect.left + position.left,
        width: 0,
        height: 0,
        x: editorRect.left + position.left,
        y: editorRect.top + position.top,
      }
    },
  })

  const { refs, floatingStyles, context } = useFloating({
    open: isVisible,
    onOpenChange: (open) => {
      if (!open) onClose()
    },
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ["bottom-start", "top-start", "bottom-end", "top-end"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  })

  const dismiss = useDismiss(context, {
    enabled: isVisible,
  })

  const role = useRole(context, {
    role: "listbox",
  })

  const { getFloatingProps } = useInteractions([dismiss, role])

  // Handle scroll to keep selected item in view
  useEffect(() => {
    if (isVisible && dropdownRef.current && selectedIndex >= 0) {
      const listContainer = dropdownRef.current.querySelector('[role="listbox"]')
      if (listContainer) {
        const selectedElement = listContainer.children[selectedIndex] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          })
        }
      }
    }
  }, [selectedIndex, isVisible])

  // Set virtual reference element based on cursor position and calculate width
  useEffect(() => {
    if (isVisible) {
      refs.setReference(virtualReference.current)

      const editorElement = editor.getRootElement()
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect()
        setReferenceWidth(rect.width || 320)
      }
    }
  }, [editor, refs, isVisible, query]) // Add query as dependency to update position when typing

  return (
    <RootPortal>
      {isVisible && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-[1000]"
          {...getFloatingProps()}
        >
          <div
            ref={dropdownRef}
            className={cn(
              "bg-material-medium backdrop-blur-background text-text shadow-context-menu",
              "min-w-32 overflow-hidden rounded-[6px] border p-1",
              "text-body",
            )}
            style={{
              width: Math.max(referenceWidth, 200),
              maxWidth: 320,
            }}
          >
            {isLoading ? (
              <div className="text-text-secondary flex items-center gap-2 px-2.5 py-1.5">
                <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-text-tertiary px-2.5 py-1.5 text-center">
                <span className="text-sm">No matches found</span>
                {query && (
                  <div className="text-text-quaternary mt-1 text-xs">
                    Try a different search term
                  </div>
                )}
              </div>
            ) : (
              <div role="listbox" aria-label="Mention suggestions">
                {suggestions.map((mention, index) => (
                  <MentionSuggestionItem
                    key={`${mention.type}-${mention.id}`}
                    mention={mention}
                    isSelected={index === selectedIndex}
                    onClick={onSelect}
                    query={query}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </RootPortal>
  )
}

MentionDropdown.displayName = "MentionDropdown"
