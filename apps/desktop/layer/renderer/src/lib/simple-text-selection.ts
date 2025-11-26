/**
 * Simple text selection utilities for ShadowDOM
 */

export interface SelectionRect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

export interface TextSelectionEvent {
  selectedText: string
  timestamp: number
  rect: SelectionRect
}

/**
 * Add text selection listener to ShadowDOM container
 */
export function addTextSelectionListener(
  shadowRoot: ShadowRoot,
  onTextSelect: (event: TextSelectionEvent) => void,
  onSelectionClear?: () => void,
): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const handleSelectionChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
      const selection = (shadowRoot as unknown as Document).getSelection?.()
      if (!selection) return

      // Check if selection is within our shadow root
      try {
        const range = selection.getRangeAt(0)
        if (!shadowRoot.contains(range.commonAncestorContainer)) return

        if (!selection.isCollapsed) {
          const selectedText = selection.toString().trim()
          if (selectedText) {
            onTextSelect({
              selectedText,
              timestamp: Date.now(),
              rect: normalizeRect(range.getBoundingClientRect()),
            })
          }
          return
        }
      } catch {
        // Uncaught IndexSizeError: Failed to execute 'getRangeAt' on 'Selection': 0 is not a valid index.
        return
      }
      onSelectionClear?.()
    }, 200)
  }

  document.addEventListener("selectionchange", handleSelectionChange)

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    document.removeEventListener("selectionchange", handleSelectionChange)
  }
}

function normalizeRect(rect: DOMRect | DOMRectReadOnly): SelectionRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}
