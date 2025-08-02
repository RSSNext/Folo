/**
 * Simple text selection utilities for ShadowDOM
 */

export interface TextSelectionEvent {
  selectedText: string
  timestamp: number
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
      const range = selection.getRangeAt(0)
      if (!shadowRoot.contains(range.commonAncestorContainer)) return

      if (!selection.isCollapsed) {
        const selectedText = selection.toString().trim()
        if (selectedText) {
          onTextSelect({
            selectedText,
            timestamp: Date.now(),
          })
        }
      } else {
        onSelectionClear?.()
      }
    }, 200)
  }

  document.addEventListener("selectionchange", handleSelectionChange)

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    document.removeEventListener("selectionchange", handleSelectionChange)
  }
}
