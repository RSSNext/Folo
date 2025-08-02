import { cn } from "@follow/utils"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { AnimatePresence, m as motion } from "motion/react"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { MentionData } from "../nodes/MentionNode"

interface MentionDropdownProps {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (mention: MentionData) => void
  query: string
}

const MentionTypeIcon = ({ type }: { type: MentionData["type"] }) => {
  switch (type) {
    case "user": {
      return <i className="i-mgc-user-3-cute-re size-4" />
    }
    case "topic": {
      return <i className="i-mgc-hashtag-cute-re size-4" />
    }
    case "channel": {
      return <i className="i-mgc-hash-cute-re size-4" />
    }
    default: {
      return <i className="i-mgc-at-cute-re size-4" />
    }
  }
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
      if (!cleanQuery || !text.toLowerCase().includes(cleanQuery)) {
        return text
      }

      const index = text.toLowerCase().indexOf(cleanQuery)
      if (index === -1) return text

      return (
        <>
          {text.slice(0, index)}
          <span className="bg-fill-vibrant text-text-vibrant font-medium">
            {text.slice(index, index + cleanQuery.length)}
          </span>
          {text.slice(index + cleanQuery.length)}
        </>
      )
    }

    return (
      <motion.div
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
          "hover:bg-fill-secondary active:bg-fill-tertiary",
          isSelected && "bg-fill-secondary",
        )}
        onClick={handleClick}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="bg-fill border-fill-secondary flex size-8 flex-shrink-0 items-center justify-center rounded-full border">
          {mention.avatar ? (
            <img
              src={mention.avatar}
              alt={mention.name}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <MentionTypeIcon type={mention.type} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text truncate font-medium">
              {highlightText(mention.name, query)}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                mention.type === "user" && "bg-blue text-white",
                mention.type === "topic" && "bg-green text-white",
                mention.type === "channel" && "bg-purple text-white",
              )}
            >
              {mention.type}
            </span>
          </div>
          {mention.description && (
            <p className="text-text-secondary mt-0.5 truncate text-sm">{mention.description}</p>
          )}
        </div>

        {isSelected && (
          <div className="flex-shrink-0">
            <i className="i-mgc-check-cute-re text-text-vibrant size-4" />
          </div>
        )}
      </motion.div>
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

      // Update position on scroll/resize
      const handleResize = () => updatePosition()
      window.addEventListener("resize", handleResize)
      window.addEventListener("scroll", handleResize, true)

      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("scroll", handleResize, true)
      }
    }
  }, [isVisible, updatePosition])

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex])

  if (!isVisible || !position) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 max-h-64 w-80 overflow-y-auto",
            "bg-material-thick border-fill-secondary rounded-xl border shadow-lg backdrop-blur-xl",
            "scrollbar-none",
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            duration: 0.15,
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-secondary flex items-center gap-2">
                <motion.div
                  className="border-fill-tertiary border-t-text-vibrant size-4 rounded-full border-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <i className="i-mgc-search-cute-re text-text-tertiary mb-2 size-8" />
                <p className="text-text-secondary text-sm">
                  No mentions found for "{query.replace("@", "")}"
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div className="border-fill-secondary mb-2 flex items-center gap-2 border-b px-3 py-2">
                <i className="i-mgc-at-cute-re text-text-secondary size-4" />
                <span className="text-text-secondary text-sm font-medium">Mentions</span>
                <span className="text-text-tertiary text-xs">
                  {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
                </span>
              </div>

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

              {suggestions.length > 0 && (
                <div className="border-fill-secondary mt-2 flex items-center justify-between border-t px-3 py-2 pt-3">
                  <div className="text-text-tertiary flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <kbd className="bg-fill-secondary rounded px-1.5 py-0.5 text-xs">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="bg-fill-secondary rounded px-1.5 py-0.5 text-xs">⏎</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="bg-fill-secondary rounded px-1.5 py-0.5 text-xs">Esc</kbd>
                      <span>Cancel</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

MentionDropdown.displayName = "MentionDropdown"
