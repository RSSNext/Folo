import { Logo } from "@follow/components/icons/logo.jsx"
import { AIShortcutButton } from "@follow/components/ui/ai-shortcut-button/index.js"
import { Button } from "@follow/components/ui/button/index.js"
import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import {
  convertLexicalToMarkdown,
  getEditorStateJSONString,
} from "@follow/components/ui/lexical-rich-editor/utils.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { tracker } from "@follow/tracker"
import { nextFrame } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import { AnimatePresence } from "framer-motion"
import { useSetAtom } from "jotai"
import type { EditorState } from "lexical"
import { $getRoot, $getSelection, $isRangeSelection, createEditor } from "lexical"
import { nanoid } from "nanoid"
import type { RefObject } from "react"
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { useI18n } from "~/hooks/common"
import { ChatInput } from "~/modules/ai-chat/components/layouts/ChatInput"
import { Messages } from "~/modules/ai-chat/components/layouts/ChatInterface"
import { useAttachScrollBeyond } from "~/modules/ai-chat/hooks/useAttachScrollBeyond"
import { useAutoScroll } from "~/modules/ai-chat/hooks/useAutoScroll"
import {
  useBlockActions,
  useChatActions,
  useChatError,
  useChatStatus,
  useCurrentChatId,
  useHasMessages,
  useMessages,
} from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, BizUIMessage } from "~/modules/ai-chat/store/types"

import { CollapsibleError } from "../ai-chat/components/layouts/CollapsibleError"
import { AIChatWaitingIndicator } from "../ai-chat/components/message/AIChatMessage"
import { LexicalAIEditorNodes } from "../ai-chat/editor"
import { stepAtom } from "./store"

const SUGGESTION_KEYS = [
  "new_user_guide.ai_chat.suggestions.fashion_designer",
  "new_user_guide.ai_chat.suggestions.nano_engineering_researcher",
  "new_user_guide.ai_chat.suggestions.drug_delivery_student",
  "new_user_guide.ai_chat.suggestions.investor_market_news",
  "new_user_guide.ai_chat.suggestions.nasa_fan",
  "new_user_guide.ai_chat.suggestions.climate_newsletter_writer",
  "new_user_guide.ai_chat.suggestions.plant_based_cooking",
  "new_user_guide.ai_chat.suggestions.cybersecurity_tracker",
  "new_user_guide.ai_chat.suggestions.japan_trip_planner",
  "new_user_guide.ai_chat.suggestions.podcast_summary_seeker",
  "new_user_guide.ai_chat.suggestions.personal_finance_builder",
  "new_user_guide.ai_chat.suggestions.robotics_coach",
  "new_user_guide.ai_chat.suggestions.saas_marketing_manager",
  "new_user_guide.ai_chat.suggestions.ai_regulation_learner",
] as const

const SUGGESTION_SAMPLE_SIZE = 5

type SuggestionKey = (typeof SUGGESTION_KEYS)[number]

function pickSuggestionKeys(previous?: readonly SuggestionKey[]): SuggestionKey[] {
  const shuffle = (input: readonly SuggestionKey[]) => {
    const pool = [...input] as SuggestionKey[]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
    }
    return pool
  }

  if (!previous || previous.length === 0) {
    return shuffle(SUGGESTION_KEYS).slice(0, SUGGESTION_SAMPLE_SIZE)
  }

  const previousSet = new Set(previous)
  const available = SUGGESTION_KEYS.filter((key) => !previousSet.has(key))

  if (available.length >= SUGGESTION_SAMPLE_SIZE) {
    return shuffle(available).slice(0, SUGGESTION_SAMPLE_SIZE)
  }

  // When there aren't enough unique suggestions left, attempt to find a fully new batch.
  const maxAttempts = 10
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = shuffle(SUGGESTION_KEYS).slice(0, SUGGESTION_SAMPLE_SIZE)
    if (!candidate.some((key) => previousSet.has(key))) {
      return candidate
    }
  }

  return shuffle(SUGGESTION_KEYS).slice(0, SUGGESTION_SAMPLE_SIZE)
}

export function AIChatPane() {
  return (
    <div className="bg-background flex h-full flex-col justify-between gap-8 overflow-hidden p-2 lg:col-span-6">
      <AIChatPaneImpl />
    </div>
  )
}

function AIChatPaneImpl() {
  const t = useI18n()

  const setStep = useSetAtom(stepAtom)

  const hasMessages = useHasMessages()
  const chatInputRef = useRef<LexicalRichEditorRef | null>(null)

  const appendSuggestionToInput = (suggestion: string) => {
    const ref = chatInputRef.current
    const editor = ref?.getEditor()

    if (!editor) {
      return
    }

    editor.focus()
    editor.update(() => {
      const root = $getRoot()
      const currentText = root.getTextContent()
      const needsLeadingSpace = currentText.length > 0 && !currentText.endsWith(" ")
      const textToInsert = needsLeadingSpace ? ` ${suggestion}` : suggestion

      root.selectEnd()
      let selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        root.selectEnd()
        selection = $getSelection()
      }

      if ($isRangeSelection(selection)) {
        selection.insertText(textToInsert)
      }
    })
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex w-full items-start justify-between px-5 pb-5">
        <Logo className="size-12" />

        <Button variant="ghost" onClick={() => setStep("manual-import")}>
          {t.app("new_user_guide.actions.import_opml")}
        </Button>
      </header>

      <AnimatePresence mode="popLayout">
        {!hasMessages && <Welcome onSuggestionClick={appendSuggestionToInput} />}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        <AIChatInterface inputRef={chatInputRef} />
      </div>
    </div>
  )
}

interface WelcomeProps {
  onSuggestionClick: (suggestion: string) => void
}

function Welcome({ onSuggestionClick }: WelcomeProps) {
  const t = useI18n()
  const [suggestionKeys, setSuggestionKeys] = useState<SuggestionKey[]>(() => pickSuggestionKeys())

  const onClickSuggestion = useEventCallback((suggestion: string) => {
    onSuggestionClick(suggestion)
  })

  const rerollSuggestions = useEventCallback(() => {
    setSuggestionKeys((prev) => pickSuggestionKeys(prev))
  })

  return (
    <div className="flex flex-col items-start gap-5 p-5">
      <div className="flex flex-col items-start gap-5">
        <div className="space-y-4">
          <p className="text-2xl leading-snug">
            {(t.app("new_user_guide.ai_chat.intro") as string).split("\n").map((line) => (
              <Fragment key={line}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-text-secondary text-xs font-medium uppercase">
            {t.app("new_user_guide.ai_chat.you_can_say")}
          </p>
          <Button variant="ghost" size="sm" onClick={rerollSuggestions}>
            <i className="i-mgc-refresh-2-cute-re mr-2 text-sm" aria-hidden />
            {t.app("new_user_guide.ai_chat.reroll")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestionKeys.map((suggestionKey, index) => {
            const suggestionText = t.app(suggestionKey) as string
            return (
              <AIShortcutButton
                key={suggestionKey}
                onClick={() => onClickSuggestion(suggestionText)}
                animationDelay={index * 0.05}
                className={cn("font-normal text-black", gradientByIndex(index))}
              >
                {suggestionText}
              </AIShortcutButton>
            )
          })}
        </div>
      </div>

      <FinishListener />
    </div>
  )
}

// if the chat response has `tool-onboardingGetTrendingFeedsTool`, set the step to pre-finish
function FinishListener() {
  const chatMessages = useMessages()
  const setStep = useSetAtom(stepAtom)
  useEffect(() => {
    const hasCalledConfirmTool = chatMessages.some((msg) =>
      // @ts-expect-error TODO: fix this after version published
      msg.parts.some((p) => p.type === "tool-onboardingGetTrendingFeeds"),
    )
    if (hasCalledConfirmTool) {
      setStep("pre-finish")
    }
  }, [chatMessages, setStep])

  return null
}

const SCROLL_BOTTOM_THRESHOLD = 100

interface AIChatInterfaceProps {
  inputRef?: RefObject<LexicalRichEditorRef | null>
}

function AIChatInterface({ inputRef }: AIChatInterfaceProps) {
  const hasMessages = useHasMessages()
  const status = useChatStatus()
  const chatActions = useChatActions()
  const error = useChatError()
  const t = useI18n()

  useEffect(() => {
    if (error) {
      console.error("AIChat Error:", error)
    }
  }, [error])

  // on init, set the scene to onboarding
  useEffect(() => {
    chatActions.setScene("onboarding")

    return () => {
      // reset the scene to general
      chatActions.setScene("general")
    }
  }, [chatActions])

  const currentChatId = useCurrentChatId()

  const [scrollAreaRef, setScrollAreaRef] = useState<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [messageContainerMinHeight, setMessageContainerMinHeight] = useState<number | undefined>()
  const previousMinHeightRef = useRef<number>(0)
  const messagesContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsAtBottom(true)
    setMessageContainerMinHeight(undefined)
    previousMinHeightRef.current = 0
  }, [currentChatId])

  const { resetScrollState } = useAutoScroll(scrollAreaRef, status === "streaming")

  const { handleScroll } = useAttachScrollBeyond()

  useEffect(() => {
    const scrollElement = scrollAreaRef

    if (!scrollElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD
      setIsAtBottom(atBottom)
    }

    scrollElement.addEventListener("scroll", handleScroll, { passive: true })

    handleScroll()

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [scrollAreaRef])

  const blockActions = useBlockActions()

  const scrollHeightBeforeSendingRef = useRef<number>(0)
  const scrollContainerParentRef = useRef<HTMLDivElement | null>(null)
  const handleScrollPositioning = useEventCallback(() => {
    const $scrollContainerParent = scrollContainerParentRef.current
    if (!scrollAreaRef || !$scrollContainerParent) return

    const parentClientHeight = $scrollContainerParent.clientHeight
    // Use actual content height captured before send (messages container height), not inflated by minHeight
    const currentScrollHeight = scrollHeightBeforeSendingRef.current

    // Calculate new minimum height based on actual content height
    // Use previousMinHeightRef which tracks the real content height, not reserved space
    const baseHeight = Math.max(previousMinHeightRef.current, currentScrollHeight)
    const newMinHeight = baseHeight + parentClientHeight - 250

    setMessageContainerMinHeight(newMinHeight)

    // Scroll to the end immediately to position user message at top
    nextFrame(() => {
      scrollAreaRef.scrollTo({
        top: scrollAreaRef.scrollHeight,
        behavior: "instant",
      })
    })
  })

  const staticEditor = useMemo(() => {
    return createEditor({
      nodes: LexicalAIEditorNodes,
    })
  }, [])

  const handleSendMessage = useEventCallback((message: string | EditorState) => {
    resetScrollState()

    const blocks = [] as AIChatContextBlock[]

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
      } else {
        blocks.push(block)
      }
    }

    const parts: BizUIMessage["parts"] = [
      {
        type: "data-block",
        data: blocks,
      },
    ]

    if (typeof message === "string") {
      parts.push({
        type: "data-rich-text",
        data: {
          state: getEditorStateJSONString(message),
          text: message,
        },
      })
    } else {
      staticEditor.setEditorState(message)
      parts.push({
        type: "data-rich-text",
        data: {
          state: JSON.stringify(message.toJSON()),
          text: convertLexicalToMarkdown(staticEditor),
        },
      })
    }

    // Capture actual content height (messages container), not including reserved minHeight
    scrollHeightBeforeSendingRef.current = messagesContentRef.current?.scrollHeight ?? 0
    chatActions.sendMessage({
      parts,
      role: "user",
      id: nanoid(),
    })
    tracker.aiChatMessageSent()

    nextFrame(() => {
      // Calculate and adjust scroll positioning immediately
      handleScrollPositioning()
    })
  })

  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(0)
  const bottomPanelRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!bottomPanelRef.current) {
      return
    }
    setBottomPanelHeight(bottomPanelRef.current.offsetHeight)

    const resizeObserver = new ResizeObserver(() => {
      if (!bottomPanelRef.current) {
        return
      }
      setBottomPanelHeight(bottomPanelRef.current.offsetHeight)
    })
    resizeObserver.observe(bottomPanelRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (status === "submitted") {
      resetScrollState()
    }

    // When AI response is complete, update the reference height but keep the container height unchanged
    // This avoids CLS while ensuring next calculation is based on actual content
    if (status === "ready" && scrollAreaRef && messagesContentRef.current) {
      // Update the reference to actual content height for next calculation (use messages container)
      previousMinHeightRef.current = messagesContentRef.current.scrollHeight
      // Keep the current minHeight unchanged to avoid CLS
    }
  }, [status, resetScrollState, messageContainerMinHeight, scrollAreaRef])

  const shouldShowScrollToBottom = hasMessages && !isAtBottom

  const messages = useMessages()
  const setStep = useSetAtom(stepAtom)

  const hasFeedsSelection = messages.some((msg) =>
    // @ts-expect-error TODO: fix this after version published
    msg.parts.some((p) => p.type === "tool-onboardingGetTrendingFeeds" && p.output),
  )

  return (
    <div className="flex h-full flex-1 flex-col" ref={scrollContainerParentRef}>
      <ScrollArea
        onScroll={handleScroll}
        flex
        scrollbarClassName="mt-12"
        scrollbarProps={{
          style: {
            marginBottom: Math.max(160, bottomPanelHeight) + (error ? 64 : 0),
          },
        }}
        ref={setScrollAreaRef}
        rootClassName="flex-1"
        viewportProps={{
          style: {
            paddingBottom: Math.max(128, bottomPanelHeight) + (error ? 64 : 0),
          },
        }}
        viewportClassName={"pt-12"}
      >
        <div
          className="mx-auto w-full px-6 py-8"
          style={{
            minHeight: messageContainerMinHeight ? `${messageContainerMinHeight}px` : undefined,
          }}
        >
          <Messages contentRef={messagesContentRef as RefObject<HTMLDivElement>} />

          {/* if the last message is from ai, show "Next Step" button */}
          {messages.length > 0 &&
            messages.at(-1)?.role === "assistant" &&
            status === "ready" &&
            hasFeedsSelection && (
              <div>
                <Button onClick={() => setStep("pre-finish")}>
                  {t.app("new_user_guide.actions.next")}
                </Button>
              </div>
            )}

          {(status === "submitted" || status === "streaming") && <AIChatWaitingIndicator />}
        </div>
      </ScrollArea>

      {shouldShowScrollToBottom && (
        <div className={cn("absolute right-1/2 z-40 translate-x-1/2", "bottom-32")}>
          <button
            type="button"
            onClick={() => resetScrollState()}
            className={cn(
              "center bg-mix-background/transparent-8/2 backdrop-blur-background group flex size-8 items-center gap-2 rounded-full border transition-all",
              "border-border",
              "hover:border-border/60 active:scale-[0.98]",
            )}
          >
            <i className="i-mingcute-arrow-down-line text-text/90" />
          </button>
        </div>
      )}

      <div
        ref={bottomPanelRef}
        className={cn(
          "duration-500 ease-in-out",
          hasMessages && "px-6 pb-6",
          !hasMessages && "px-6 pb-6 duration-200",
        )}
      >
        {error && <CollapsibleError error={error} />}
        <ChatInput
          ref={inputRef}
          onSend={handleSendMessage}
          variant={!hasMessages ? "minimal" : "default"}
        />
      </div>
    </div>
  )
}

const GRADIENT_CLASSES = [
  "bg-gradient-to-r from-[#ff8a00] to-[#ff5f2d]",
  "bg-gradient-to-r from-[#0ccb8b] to-[#00a36c]",
  "bg-gradient-to-r from-[#ffd700] to-[#ffa800]",
  "bg-gradient-to-r from-[#9b5df5] to-[#7848ff]",
  "bg-gradient-to-r from-[#ff5dc5] to-[#7a5cff]",
]

function gradientByIndex(index: number) {
  return GRADIENT_CLASSES[index % GRADIENT_CLASSES.length]
}
