import { convertLexicalToMarkdown } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import type { AIShortcut } from "@follow/shared/settings/interface"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"
import type { EditorState } from "lexical"
import { $createParagraphNode, $getRoot, createEditor } from "lexical"
import { nanoid } from "nanoid"
import { use, useCallback, useMemo } from "react"

import {
  getShortcutEffectivePrompt,
  setAIPanelVisibility,
  useAISettingKey,
} from "~/atoms/settings/ai"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useRequireLogin } from "~/hooks/common/useRequireLogin"
import type { ShortcutData } from "~/modules/ai-chat/editor"
import { LexicalAIEditorNodes, ShortcutNode } from "~/modules/ai-chat/editor"
import { AIPanelRefsContext } from "~/modules/ai-chat/store/AIChatContext"
import { useBlockActions, useChatActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, SendingUIMessage } from "~/modules/ai-chat/store/types"
import { prefixMessageIdWithShortcut } from "~/modules/ai-chat/utils/shortcut"

type ShortcutLike = ShortcutData | AIShortcut

type ShortcutResolver =
  | {
      shortcutId: string
      shortcut?: never
    }
  | {
      shortcutId?: never
      shortcut: ShortcutLike
    }

type SendAIShortcutOptions = ShortcutResolver & {
  behavior?: "send" | "prefill"
  ensureNewChat?: boolean
  openPanel?: boolean
  onSend?: (editorState: EditorState) => void | Promise<void>
}

export const useSendAIShortcut = () => {
  const shortcuts = useAISettingKey("shortcuts")
  const chatActions = useChatActions()
  const blockActions = useBlockActions()
  const aiPanelRefs = use(AIPanelRefsContext)
  const { ensureLogin } = useRequireLogin()

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

  const resolveShortcut = useCallback(
    ({ shortcutId, shortcut }: { shortcutId?: string; shortcut?: ShortcutLike }) => {
      const allShortcuts = shortcuts ?? []
      const source =
        shortcut ??
        (shortcutId
          ? allShortcuts.find((item) => item.id === shortcutId && item.enabled)
          : undefined)

      if (!source) {
        return null
      }

      if ("enabled" in source && source.enabled === false) {
        return null
      }

      const promptSource =
        "defaultPrompt" in source ? getShortcutEffectivePrompt(source as AIShortcut) : source.prompt

      const prompt = (promptSource || "").trim()
      if (!prompt) {
        return null
      }

      return {
        id: source.id,
        name: source.name || source.id,
        prompt,
        hotkey: source.hotkey,
        displayTargets: source.displayTargets,
      } satisfies ShortcutData
    },
    [shortcuts],
  )

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
    (editorState: EditorState, shortcutId?: string) => {
      const isTimelineSummaryShortcut = shortcutId === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID
      if (!isTimelineSummaryShortcut && !ensureLogin()) {
        return
      }
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
        id: prefixMessageIdWithShortcut(nanoid(), shortcutId),
      }

      void chatActions.sendMessage(
        message,
        isTimelineSummaryShortcut
          ? {
              body: {
                scene: "timeline-summary",
              },
            }
          : undefined,
      )
    },
    [buildContextBlocks, chatActions, ensureLogin, staticEditor],
  )

  const prefillInput = useCallback(
    (editorState: EditorState) => {
      const editorRef = aiPanelRefs?.inputRef?.current
      if (!editorRef) {
        return false
      }

      const lexicalEditor = editorRef.getEditor()
      const serialized = editorState.toJSON()
      const parsedState = lexicalEditor.parseEditorState(serialized)
      lexicalEditor.setEditorState(parsedState)
      editorRef.focus()

      return true
    },
    [aiPanelRefs],
  )

  const sendAIShortcut = useCallback(
    async (options: SendAIShortcutOptions) => {
      const {
        behavior = "send",
        ensureNewChat = false,
        openPanel = true,
        onSend,
        shortcut,
        shortcutId,
      } = options

      if (!shortcut && !shortcutId) {
        return false
      }

      if (openPanel) {
        setAIPanelVisibility(true)
      }

      const shortcutData = resolveShortcut({ shortcut, shortcutId })

      if (!shortcutData) {
        return false
      }

      const editorState = createShortcutEditorState(shortcutData)

      if (behavior === "prefill") {
        return prefillInput(editorState)
      }

      if (typeof onSend === "function") {
        await onSend(editorState)
        return true
      }

      if (ensureNewChat) {
        await chatActions.newChat()
      }

      sendShortcutMessage(editorState, shortcutData.id)
      return true
    },
    [chatActions, createShortcutEditorState, prefillInput, resolveShortcut, sendShortcutMessage],
  )

  const hasShortcut = useCallback(
    (shortcutId: string) => {
      return !!resolveShortcut({ shortcutId })
    },
    [resolveShortcut],
  )

  return {
    sendAIShortcut,
    hasShortcut,
  }
}
