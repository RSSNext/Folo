import { $createTextNode, $getSelection, $isRangeSelection } from "lexical"
import { memo, Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AIPanelRefsContext } from "~/modules/ai-chat/store/AIChatContext"

import { MentionDropdown } from "../../editor/plugins/mention/components/MentionDropdown"
import { useMentionSearchService } from "../../editor/plugins/mention/hooks/useMentionSearchService"
import { $createMentionNode } from "../../editor/plugins/mention/MentionNode"
import type { MentionData } from "../../editor/plugins/mention/types"

/**
 * Button component that triggers a mention dropdown for manual context selection
 * Allows users to add mentions (@feed, @entry, @date, etc.) to the input field
 */
export const MentionButton: Component = memo(() => {
  const atButtonRef = useRef<HTMLButtonElement>(null)
  const [isMentionDropdownVisible, setIsMentionDropdownVisible] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<MentionData[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const aiPanelRefs = use(AIPanelRefsContext)
  const { searchMentions } = useMentionSearchService()

  const handleAtButtonClick = useCallback(() => {
    setIsMentionDropdownVisible(true)
    setQuery("")
  }, [])

  // Search mentions when query changes
  useEffect(() => {
    if (!isMentionDropdownVisible) return

    const performSearch = async () => {
      setIsLoading(true)
      try {
        const results = await searchMentions(query)
        setSuggestions(results)
        setSelectedIndex(0)
      } finally {
        setIsLoading(false)
      }
    }

    void performSearch()
  }, [query, searchMentions, isMentionDropdownVisible])

  const handleMentionSelect = useCallback(
    (mention: MentionData) => {
      // Get the editor from the context
      const editorRef = aiPanelRefs.inputRef.current
      if (!editorRef) return

      const editor = editorRef.getEditor()
      if (!editor) return

      // Insert mention node at current cursor position
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

        // Create and insert mention node
        const mentionNode = $createMentionNode(mention)
        selection.insertNodes([mentionNode])

        // Add a space after the mention
        const spaceNode = $createTextNode(" ")
        selection.insertNodes([spaceNode])
      })

      // Focus back on the editor
      editor.focus()
      setIsMentionDropdownVisible(false)
    },
    [aiPanelRefs],
  )

  const handleMentionDropdownClose = useCallback(() => {
    setIsMentionDropdownVisible(false)
    setQuery("")
  }, [])

  // Calculate dropdown props
  const dropdownProps = useMemo(() => {
    if (!isMentionDropdownVisible) return null

    return {
      isVisible: true,
      suggestions,
      selectedIndex,
      isLoading,
      onSetSelectIndex: setSelectedIndex,
      onSelect: handleMentionSelect,
      onClose: handleMentionDropdownClose,
      query,
      anchor: atButtonRef.current,
      showSearchInput: true,
      onQueryChange: setQuery,
    }
  }, [
    isMentionDropdownVisible,
    suggestions,
    selectedIndex,
    isLoading,
    handleMentionSelect,
    handleMentionDropdownClose,
    query,
  ])

  return (
    <>
      <button
        ref={atButtonRef}
        type="button"
        onClick={handleAtButtonClick}
        className="flex size-7 items-center justify-center rounded-md border border-border bg-material-medium text-text-secondary transition-colors hover:bg-material-thin hover:text-text-secondary"
        title="Add Context"
      >
        <i className="i-mgc-at-cute-re size-3.5" />
      </button>

      {dropdownProps ? (
        <Suspense fallback={null}>
          <MentionDropdown {...dropdownProps} />
        </Suspense>
      ) : null}
    </>
  )
})

MentionButton.displayName = "MentionButton"
