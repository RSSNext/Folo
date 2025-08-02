import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalEditor, TextNode } from "lexical"
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical"
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { MentionDropdown } from "../components/MentionDropdown"
import type { MentionData, MentionType } from "../nodes/MentionNode"
import { $createMentionNode, MentionNode } from "../nodes/MentionNode"

export interface MentionMatch {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

export interface MentionPluginProps {
  onSearch?: (query: string, type: MentionType) => Promise<MentionData[]> | MentionData[]
  mentionTypes?: MentionType[]
  maxSuggestions?: number
  triggerFn?: (text: string, editor: LexicalEditor) => MentionMatch | null
  onMentionInsert?: (mention: MentionData) => void
}

// Commands
export const MENTION_COMMAND = createCommand<MentionData>("MENTION_COMMAND")
export const MENTION_TYPEAHEAD_COMMAND = createCommand<string>("MENTION_TYPEAHEAD_COMMAND")

// Default mention trigger function
const defaultTriggerFn = (text: string, editor: LexicalEditor): MentionMatch | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null
  }

  const { anchor } = selection
  const { focus } = selection
  const anchorNode = anchor.getNode()

  // Only trigger on text nodes
  if (!$isTextNode(anchorNode) || anchor.key !== focus.key || anchor.offset !== focus.offset) {
    return null
  }

  const textContent = anchorNode.getTextContent()
  const cursorOffset = anchor.offset

  // Look for @ symbol followed by text
  const mentionMatch = textContent.slice(0, cursorOffset).match(/(?:^|\s)(@[\w-]*)$/)

  if (!mentionMatch) {
    return null
  }

  const matchingString = mentionMatch[1] || ""
  const replaceableString = matchingString
  const leadOffset = (mentionMatch.index ?? 0) + (mentionMatch[0]?.startsWith(" ") ? 1 : 0)

  return {
    leadOffset,
    matchingString,
    replaceableString,
  }
}

// Default search function
const defaultSearchFn = async (query: string, type: MentionType): Promise<MentionData[]> => {
  // Mock data for demonstration
  const mockData: Record<MentionType, MentionData[]> = {
    user: [
      { id: "1", name: "john_doe", type: "user", avatar: "", description: "Software Engineer" },
      { id: "2", name: "jane_smith", type: "user", avatar: "", description: "Designer" },
      { id: "3", name: "bob_wilson", type: "user", avatar: "", description: "Product Manager" },
    ],
    topic: [
      { id: "1", name: "javascript", type: "topic", description: "Programming language" },
      { id: "2", name: "react", type: "topic", description: "UI Library" },
      { id: "3", name: "lexical", type: "topic", description: "Rich text editor" },
    ],
    channel: [
      { id: "1", name: "general", type: "channel", description: "General discussion" },
      { id: "2", name: "dev-team", type: "channel", description: "Development team" },
      { id: "3", name: "design", type: "channel", description: "Design discussions" },
    ],
  }

  const cleanQuery = query.replace("@", "").toLowerCase()
  const items = mockData[type] || []

  if (!cleanQuery) {
    return items.slice(0, 5)
  }

  return items.filter((item) => item.name.toLowerCase().includes(cleanQuery)).slice(0, 5)
}

export function MentionPlugin({
  onSearch = defaultSearchFn,
  mentionTypes = ["user", "topic", "channel"],
  maxSuggestions = 10,
  triggerFn = defaultTriggerFn,
  onMentionInsert,
}: MentionPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null)
  const [suggestions, setSuggestions] = useState<MentionData[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Determine mention type from query
  const getMentionType = useCallback((query: string): MentionType => {
    // Simple heuristic - could be enhanced with more sophisticated detection
    if (query.startsWith("@#")) return "channel"
    if (query.startsWith("@+")) return "topic"
    return "user"
  }, [])

  // Handle mention selection
  const selectMention = useCallback(
    (mentionData: MentionData) => {
      if (!mentionMatch) return

      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

        const { anchor } = selection
        const anchorNode = anchor.getNode()

        if (!$isTextNode(anchorNode)) return

        // Replace the mention text with the mention node
        const textContent = anchorNode.getTextContent()
        const { leadOffset, replaceableString } = mentionMatch

        // Split the text node
        const beforeText = textContent.slice(0, leadOffset)
        const afterText = textContent.slice(leadOffset + replaceableString.length)

        // Create new nodes
        const beforeNode = beforeText ? $createTextNode(beforeText) : null
        const mentionNode = $createMentionNode(mentionData)
        const afterNode = afterText ? $createTextNode(afterText) : null

        // Replace the current node
        if (beforeNode) {
          anchorNode.insertBefore(beforeNode)
        }
        anchorNode.insertBefore(mentionNode)
        if (afterNode) {
          anchorNode.insertBefore(afterNode)
        }

        // Remove the original node
        anchorNode.remove()

        // Position cursor after the mention
        if (afterNode) {
          afterNode.select(0, 0)
        } else {
          // Create a space after the mention if there's no following text
          const spaceNode = $createTextNode(" ")
          mentionNode.insertAfter(spaceNode)
          spaceNode.select(1, 1)
        }
      })

      // Clear state
      setMentionMatch(null)
      setSuggestions([])
      setSelectedIndex(0)

      // Notify callback
      onMentionInsert?.(mentionData)
    },
    [editor, mentionMatch, onMentionInsert],
  )

  // Search for mentions
  const searchMentions = useCallback(
    async (query: string) => {
      if (!query.startsWith("@") || query.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const mentionType = getMentionType(query)
        const results = await onSearch(query, mentionType)
        setSuggestions(results.slice(0, maxSuggestions))
        setSelectedIndex(0)
      } catch (error) {
        console.error("Error searching mentions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [onSearch, getMentionType, maxSuggestions],
  )

  // Handle keyboard navigation
  const handleArrowKey = useCallback(
    (isUp: boolean) => {
      if (suggestions.length === 0) return false

      setSelectedIndex((prev) => {
        if (isUp) {
          return prev <= 0 ? suggestions.length - 1 : prev - 1
        } else {
          return prev >= suggestions.length - 1 ? 0 : prev + 1
        }
      })
      return true
    },
    [suggestions.length],
  )

  // Handle enter key
  const handleEnterKey = useCallback(() => {
    if (suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const mention = suggestions[selectedIndex]
      if (mention) {
        selectMention(mention)
        return true
      }
    }
    return false
  }, [suggestions, selectedIndex, selectMention])

  // Handle escape key
  const handleEscapeKey = useCallback(() => {
    if (mentionMatch) {
      setMentionMatch(null)
      setSuggestions([])
      setSelectedIndex(0)
      return true
    }
    return false
  }, [mentionMatch])

  // Register commands
  useEffect(() => {
    const removeCommands = [
      // Mention insertion command
      editor.registerCommand(
        MENTION_COMMAND,
        (mentionData: MentionData) => {
          selectMention(mentionData)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Arrow key navigation
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (mentionMatch && suggestions.length > 0) {
            event.preventDefault()
            return handleArrowKey(true)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (mentionMatch && suggestions.length > 0) {
            event.preventDefault()
            return handleArrowKey(false)
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Enter key
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (mentionMatch && suggestions.length > 0) {
            event?.preventDefault()
            return handleEnterKey()
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Tab key (same as enter)
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (mentionMatch && suggestions.length > 0) {
            event.preventDefault()
            return handleEnterKey()
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Escape key
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (mentionMatch) {
            event.preventDefault()
            return handleEscapeKey()
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    ]

    return () => {
      removeCommands.forEach((remove) => remove())
    }
  }, [
    editor,
    mentionMatch,
    suggestions,
    selectMention,
    handleArrowKey,
    handleEnterKey,
    handleEscapeKey,
  ])

  // Monitor text changes for mention triggers
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setMentionMatch(null)
          setSuggestions([])
          return
        }

        const { anchor } = selection
        const anchorNode = anchor.getNode()

        if (!$isTextNode(anchorNode)) {
          setMentionMatch(null)
          setSuggestions([])
          return
        }

        const textContent = anchorNode.getTextContent()
        const match = triggerFn(textContent, editor)

        if (match) {
          setMentionMatch(match)
          searchMentions(match.matchingString)
        } else {
          setMentionMatch(null)
          setSuggestions([])
        }
      })
    })

    return removeUpdateListener
  }, [editor, triggerFn, searchMentions])

  // Calculate dropdown position
  const dropdownProps = useMemo(() => {
    if (!mentionMatch) return null

    return {
      isVisible: mentionMatch !== null && suggestions.length > 0,
      suggestions,
      selectedIndex,
      isLoading,
      onSelect: selectMention,
      query: mentionMatch.matchingString,
    }
  }, [mentionMatch, suggestions, selectedIndex, isLoading, selectMention])

  return dropdownProps ? <MentionDropdown {...dropdownProps} /> : null
}
