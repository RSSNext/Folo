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
import { useEffect, useMemo, useRef, useState } from "react"

import { calculateDropdownPosition } from "../utils/positioning"

export interface TypeaheadGroup<TItem, TGroupKey = string> {
  key: TGroupKey
  items: TItem[]
}

export interface TypeaheadDropdownProps<TItem, TGroupKey = string> {
  isVisible: boolean
  items: TItem[] | TypeaheadGroup<TItem, TGroupKey>[]
  selectedIndex: number
  isLoading: boolean
  onSelect: (item: TItem) => void
  onSetSelectIndex: (index: number) => void
  onClose: () => void
  query: string
  ariaLabel: string
  renderItem: (
    item: TItem,
    index: number,
    isSelected: boolean,
    handlers: { onMouseMove: () => void; onClick: () => void },
  ) => React.ReactNode
  getKey: (item: TItem) => string
  loadingMessage?: string
  emptyMessage?: string
  emptyHint?: string
  anchor?: HTMLElement | null
  showSearchInput?: boolean
  onQueryChange?: (query: string) => void
  // Group support
  renderGroupHeader?: (groupKey: TGroupKey) => React.ReactNode
}

function useOptionalLexicalEditor() {
  try {
    const [editor] = useLexicalComposerContext()
    return editor
  } catch {
    return null
  }
}

export function TypeaheadDropdown<TItem, TGroupKey = string>({
  isVisible,
  items,
  selectedIndex,
  isLoading,
  onSelect,
  onSetSelectIndex,
  onClose,
  query,
  ariaLabel,
  renderItem,
  getKey,
  loadingMessage = "Searching...",
  emptyMessage = "No matches found",
  emptyHint = "Try a different search term",
  anchor,
  showSearchInput = false,
  onQueryChange,
  renderGroupHeader,
}: TypeaheadDropdownProps<TItem, TGroupKey>) {
  if (!isVisible) throw thenable

  const editor = useOptionalLexicalEditor()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [referenceWidth, setReferenceWidth] = useState<number>(320)

  // Check if items are grouped
  const isGrouped =
    items.length > 0 && typeof items[0] === "object" && items[0] !== null && "key" in items[0]

  // Flatten grouped items for selection logic
  const flatItems = useMemo(() => {
    if (!isGrouped) return items as TItem[]
    return (items as TypeaheadGroup<TItem, TGroupKey>[]).flatMap((group) => group.items)
  }, [items, isGrouped])

  const virtualReference = useRef({
    getBoundingClientRect: () => {
      // If anchor is provided, use it
      if (anchor) {
        return anchor.getBoundingClientRect()
      }

      if (!editor) {
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
        }
      }

      const position = calculateDropdownPosition(editor)
      const editorElement = editor.getRootElement()

      if (!position || !editorElement) {
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

  useEffect(() => {
    if (isVisible) {
      refs.setReference(virtualReference.current)

      const editorElement = editor?.getRootElement()
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect()
        setReferenceWidth(rect.width || 320)
      }
    }
  }, [editor, refs, isVisible, query])

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary">
          <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
          <span className="text-sm">{loadingMessage}</span>
        </div>
      )
    }

    const totalItems = isGrouped ? flatItems.length : items.length
    if (totalItems === 0) {
      return (
        <div className="px-2.5 py-1.5 text-center text-text-tertiary">
          <span className="text-sm">{emptyMessage}</span>
          {query && <div className="mt-1 text-xs text-text-quaternary">{emptyHint}</div>}
        </div>
      )
    }

    if (!isGrouped) {
      // Render flat list
      return (
        <div role="listbox" aria-label={ariaLabel}>
          {(items as TItem[]).map((item, index) => {
            const isSelected = index === selectedIndex
            const handlers = {
              onMouseMove: () => onSetSelectIndex(index),
              onClick: () => onSelect(item),
            }
            return (
              <React.Fragment key={getKey(item)}>
                {renderItem(item, index, isSelected, handlers)}
              </React.Fragment>
            )
          })}
        </div>
      )
    }

    // Render grouped list
    let itemIndex = 0
    return (
      <div role="listbox" aria-label={ariaLabel}>
        {(items as TypeaheadGroup<TItem, TGroupKey>[]).map((group) => (
          <React.Fragment key={String(group.key)}>
            {renderGroupHeader && renderGroupHeader(group.key)}
            {group.items.map((item) => {
              const currentIndex = itemIndex
              itemIndex++
              const isSelected = currentIndex === selectedIndex
              const handlers = {
                onMouseMove: () => onSetSelectIndex(currentIndex),
                onClick: () => onSelect(item),
              }
              return (
                <React.Fragment key={getKey(item)}>
                  {renderItem(item, currentIndex, isSelected, handlers)}
                </React.Fragment>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }, [
    isLoading,
    items,
    selectedIndex,
    renderItem,
    getKey,
    ariaLabel,
    query,
    loadingMessage,
    emptyMessage,
    emptyHint,
    onSetSelectIndex,
    onSelect,
    isGrouped,
    flatItems,
    renderGroupHeader,
  ])

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
              "shadow-context-menu bg-material-medium text-text backdrop-blur-background",
              "min-w-32 overflow-hidden rounded-[6px] border p-1",
              "text-body",
            )}
            style={{
              width: anchor ? 320 : Math.max(referenceWidth, 200),
              maxWidth: 320,
            }}
          >
            {showSearchInput && onQueryChange && (
              <div className="-mx-1 mb-1 border-b border-border px-3.5 pb-1.5 pt-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const suggestion = flatItems[selectedIndex] || flatItems[0]
                      if (suggestion) {
                        e.preventDefault()
                        onSelect(suggestion)
                      }
                    }
                  }}
                  placeholder="Search for context..."
                  autoFocus
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-quaternary"
                />
              </div>
            )}
            {content}
          </div>
        </div>
      )}
    </RootPortal>
  )
}

TypeaheadDropdown.displayName = "TypeaheadDropdown"
