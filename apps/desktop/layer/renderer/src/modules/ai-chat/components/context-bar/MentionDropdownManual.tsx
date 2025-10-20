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
import { cn } from "@follow/utils"
import * as React from "react"
import { useEffect, useRef } from "react"

import { MentionSuggestionItem } from "../../editor/plugins/mention/components/shared/MentionSuggestionItem"
import type { MentionData } from "../../editor/plugins/mention/types"

interface MentionDropdownManualProps {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (mention: MentionData) => void
  onSetSelectIndex: (index: number) => void
  onClose: () => void
  query: string
  anchor: HTMLElement | null
  onQueryChange: (query: string) => void
}

export const MentionDropdownManual: React.FC<MentionDropdownManualProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  isLoading,
  onSelect,
  onSetSelectIndex,
  onClose,
  query,
  anchor,
  onQueryChange,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isVisible,
    onOpenChange: (open) => {
      if (!open) onClose()
    },
    elements: {
      reference: anchor,
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

  if (!isVisible) return null

  return (
    <RootPortal>
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
            width: 320,
            maxWidth: 320,
          }}
        >
          {/* Search Input */}
          <div className="border-border/20 mb-1 border-b px-2 pb-1.5 pt-1">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search for context..."
              autoFocus
              className="text-text placeholder:text-text-quaternary w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* Suggestions List */}
          {isLoading ? (
            <div className="text-text-secondary flex items-center gap-2 px-2.5 py-1.5">
              <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-text-tertiary px-2.5 py-1.5 text-center">
              <span className="text-sm">No matches found</span>
              {query && (
                <div className="text-text-quaternary mt-1 text-xs">Try a different search term</div>
              )}
            </div>
          ) : (
            <div
              role="listbox"
              aria-label="Mention suggestions"
              className="max-h-[300px] overflow-y-auto"
            >
              {suggestions.map((mention, index) => (
                <MentionSuggestionItem
                  key={`${mention.type}-${mention.id}`}
                  mention={mention}
                  isSelected={index === selectedIndex}
                  onMouseMove={() => onSetSelectIndex(index)}
                  onClick={onSelect}
                  query={query}
                  cleanQueryWithPattern={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RootPortal>
  )
}

MentionDropdownManual.displayName = "MentionDropdownManual"
