import { RootPortal } from "@follow/components/ui/portal/index.js"
import { cn } from "@follow/utils"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { AnimatePresence, m as motion } from "motion/react"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { MentionData } from "../types"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionDropdownProps {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (mention: MentionData) => void
  query: string
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
      const cleanQuery = query.replace("@", "").toLowerCase()
      if (!cleanQuery) return text

      const parts = text.split(new RegExp(`(${cleanQuery})`, "gi"))
      return parts.map((part, partIndex) => {
        const isMatch = part.toLowerCase() === cleanQuery
        return (
          <span
            key={`${mention.id}-${part}-${partIndex}`}
            className={isMatch ? "text-text-vibrant font-semibold" : ""}
          >
            {part}
          </span>
        )
      })
    }

    return (
      <DropdownMenuPrimitive.Item
        className={cn(
          "relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
          "focus:outline-none",
          "data-[highlighted]:bg-material-thin data-[highlighted]:backdrop-blur-xl",
          "hover:bg-material-thin hover:scale-[1.02] hover:backdrop-blur-xl",
          "data-[highlighted]:shadow-sm",
          isSelected && "bg-material-medium shadow-md backdrop-blur-xl",
        )}
        onSelect={handleClick}
      >
        {/* Avatar/Icon */}
        <div className="bg-fill-secondary border-fill-tertiary flex size-9 flex-shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-md">
          <MentionTypeIcon type={mention.type} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text truncate font-medium leading-tight">
              {highlightText(mention.name, query)}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide shadow-sm",
                "backdrop-blur-sm",
                mention.type === "entry" && "bg-blue/20 text-blue border-blue/30 border",
                mention.type === "feed" && "bg-orange/20 text-orange border-orange/30 border",
              )}
            >
              {mention.type}
            </span>
          </div>
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              <i className="i-mgc-check-cute-re text-text-vibrant size-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownMenuPrimitive.Item>
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
  query,
}) => {
  const [editor] = useLexicalComposerContext()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Calculate position based on cursor
  const updatePosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const editorElement = editor.getRootElement()

    if (!editorElement) return

    const editorRect = editorElement.getBoundingClientRect()

    setPosition({
      top: rect.bottom - editorRect.top + 8, // 8px offset below cursor
      left: rect.left - editorRect.left,
    })
  }, [editor])

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      updatePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isVisible, updatePosition])

  // Handle scroll to keep dropdown in view
  useEffect(() => {
    if (isVisible && dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex, isVisible])

  if (!isVisible || !position) return null

  return (
    <RootPortal>
      <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuPrimitive.Portal>
          <div
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              zIndex: 1000,
            }}
          >
            <AnimatePresence>
              {isOpen && (
                <DropdownMenuPrimitive.Content
                  asChild
                  sideOffset={0}
                  align="start"
                  className="z-[1000]"
                >
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={cn(
                      "bg-material-medium border-fill-secondary backdrop-blur-xl",
                      "min-w-72 max-w-80 overflow-hidden rounded-xl border shadow-xl",
                      "motion-reduce:transition-none",
                      // Glass effect
                      "bg-opacity-80 backdrop-blur-2xl backdrop-saturate-150",
                      // Advanced shadow for depth
                      "shadow-2xl drop-shadow-lg",
                      // Subtle border gradient effect
                      "ring-fill-tertiary/50 ring-1",
                    )}
                  >
                    {/* Header */}
                    <div className="bg-material-thick border-fill-tertiary/50 border-b px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <i className="i-mgc-at-cute-re text-text-secondary size-4" />
                        <span className="text-text-secondary text-sm font-medium">Mentions</span>
                        {query && (
                          <span className="text-text-tertiary text-xs">
                            for "{query.replace("@", "")}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-64 overflow-y-auto p-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="flex items-center gap-3">
                            <i className="i-mgc-loading-3-cute-re text-text-secondary size-5 animate-spin" />
                            <span className="text-text-secondary text-sm">Searching...</span>
                          </div>
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <i className="i-mgc-search-cute-re text-text-tertiary mb-2 size-6" />
                          <span className="text-text-tertiary text-sm">No matches found</span>
                          {query && (
                            <span className="text-text-quaternary mt-1 text-xs">
                              Try a different search term
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
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

                    {/* Footer with keyboard hint */}
                    {suggestions.length > 0 && !isLoading && (
                      <div className="border-fill-tertiary/50 border-t px-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="text-text-quaternary flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <kbd className="bg-fill-secondary border-fill-tertiary rounded px-1.5 py-0.5 text-xs font-medium">
                                ↑↓
                              </kbd>
                              Navigate
                            </span>
                            <span className="flex items-center gap-1">
                              <kbd className="bg-fill-secondary border-fill-tertiary rounded px-1.5 py-0.5 text-xs font-medium">
                                ↵
                              </kbd>
                              Select
                            </span>
                            <span className="flex items-center gap-1">
                              <kbd className="bg-fill-secondary border-fill-tertiary rounded px-1.5 py-0.5 text-xs font-medium">
                                Esc
                              </kbd>
                              Cancel
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </DropdownMenuPrimitive.Content>
              )}
            </AnimatePresence>
          </div>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </RootPortal>
  )
}

MentionDropdown.displayName = "MentionDropdown"
