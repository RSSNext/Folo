import { convertLexicalToMarkdown } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import type { EditorState } from "lexical"
import { $createParagraphNode, $getRoot, createEditor } from "lexical"
import { nanoid } from "nanoid"
import { useCallback, useMemo } from "react"

import {
  getShortcutEffectivePrompt,
  setAIPanelVisibility,
  useAISettingKey,
} from "~/atoms/settings/ai"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import type { ShortcutData } from "~/modules/ai-chat/editor"
import { LexicalAIEditorNodes, ShortcutNode } from "~/modules/ai-chat/editor"
import { useBlockActions, useChatActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, SendingUIMessage } from "~/modules/ai-chat/store/types"

export const useSummarizeTimeline = () => {
  const shortcuts = useAISettingKey("shortcuts")
  const chatActions = useChatActions()
  const blockActions = useBlockActions()

  const defaultSummarizeShortcut = useMemo<ShortcutData | null>(() => {
    const allShortcuts = shortcuts ?? []
    const shortcut = allShortcuts.find(
      (item) => item.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID && item.enabled,
    )

    if (!shortcut) {
      return null
    }

    const prompt = getShortcutEffectivePrompt(shortcut).trim()
    if (!prompt) {
      return null
    }

    return {
      id: shortcut.id,
      name: shortcut.name || "Summarize timeline",
      prompt,
      hotkey: shortcut.hotkey,
      displayTargets: shortcut.displayTargets,
    }
  }, [shortcuts])

  const staticEditor = useMemo(() => {
    return createEditor({
      nodes: LexicalAIEditorNodes,
    })
  }, [])

  const createShortcutEditorState = useCallback((shortcutData: ShortcutData): EditorState => {
    const tempEditor = createEditor({
      nodes: LexicalAIEditorNodes,
    })

    tempEditor.update(
      () => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        const shortcutNode = new ShortcutNode(shortcutData)
        paragraph.append(shortcutNode)
        root.append(paragraph)
      },
      {
        discrete: true,
      },
    )

    return tempEditor.getEditorState()
  }, [])

  const buildContextBlocks = useCallback((): AIChatContextBlock[] => {
    const blocks: AIChatContextBlock[] = []

    for (const block of blockActions.getBlocks()) {
      if (block.type === "fileAttachment" && block.attachment.serverUrl) {
        blocks.push({
          ...block,
          attachment: {
            id: block.attachment.id,
            name: block.attachment.name,
            type: block.attachment.type,
            size: block.attachment.size,
            serverUrl: block.attachment.serverUrl,
          },
        })
      } else if (block.type === "mainFeed" && block.value.startsWith(ROUTE_FEED_IN_FOLDER)) {
        const categoryName = block.value.slice(ROUTE_FEED_IN_FOLDER.length)
        const { view } = getRouteParams()
        const feedIds = getCategoryFeedIds(categoryName, view)
        blocks.push({
          ...block,
          value: feedIds.join(","),
        })
      } else {
        blocks.push(block)
      }
    }

    return blocks.filter((block) => !block.disabled)
  }, [blockActions])

  const sendShortcutMessage = useCallback(
    (editorState: EditorState) => {
      const contextBlocks = buildContextBlocks()

      staticEditor.setEditorState(editorState)

      const parts: SendingUIMessage["parts"] = [
        {
          type: "data-block",
          data: contextBlocks,
        },
        {
          type: "data-rich-text",
          data: {
            state: JSON.stringify(editorState.toJSON()),
            text: convertLexicalToMarkdown(staticEditor),
          },
        },
      ]

      const message: SendingUIMessage = {
        parts,
        role: "user",
        id: nanoid(),
      }

      void chatActions.sendMessage(message)
    },
    [buildContextBlocks, chatActions, staticEditor],
  )

  const summarizeTimeline = useCallback(() => {
    setAIPanelVisibility(true)

    if (!defaultSummarizeShortcut) {
      return
    }

    void (async () => {
      await chatActions.newChat()
      const editorState = createShortcutEditorState(defaultSummarizeShortcut)
      sendShortcutMessage(editorState)
    })()
  }, [chatActions, createShortcutEditorState, defaultSummarizeShortcut, sendShortcutMessage])

  return {
    summarizeTimeline,
    hasSummarizeShortcut: !!defaultSummarizeShortcut,
  }
}
