import type { LexicalEditor } from "lexical"

import type { MentionDropdownPosition } from "../types"

export const calculateDropdownPosition = (
  editor: LexicalEditor,
): MentionDropdownPosition | null => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const editorElement = editor.getRootElement()

  if (!editorElement) return null

  const editorRect = editorElement.getBoundingClientRect()

  return {
    top: rect.bottom - editorRect.top + 8, // 8px offset below cursor
    left: rect.left - editorRect.left,
  }
}

export const scrollSelectedItemIntoView = (
  containerRef: React.RefObject<HTMLElement>,
  selectedIndex: number,
): void => {
  if (!containerRef.current || selectedIndex < 0) return

  const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement
  if (selectedElement) {
    selectedElement.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    })
  }
}
