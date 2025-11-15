import { Spring } from "@follow/components/constants/spring.js"
import { Folo } from "@follow/components/icons/folo.js"
import { getEditorStateJSONString } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import * as React from "react"

import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"
import { AIMarkdownStreamingMessage } from "~/modules/ai-chat/components/message/AIMarkdownMessage"
import { UserMessageParts } from "~/modules/ai-chat/components/message/UserMessageParts"
import type { BizUIMessage } from "~/modules/ai-chat/store/types"

type PreviewMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

const buildUserBizMessage = (id: string, text: string): BizUIMessage => {
  return {
    id,
    role: "user",
    parts: [
      {
        type: "data-rich-text",
        data: {
          state: getEditorStateJSONString(text),
          text,
        },
      },
    ],
    createdAt: new Date(),
  }
}

const chatScript: PreviewMessage[] = [
  {
    id: "m1",
    role: "user",
    text: "Help me follow the latest AI trends for frontend.",
  },
  {
    id: "m2",
    role: "assistant",
    text:
      "Sure — here are key updates this week:\n\n" +
      "- React 19 RC brings Actions and built-in async APIs.\n" +
      "- Vite 6 improves SSR and dev server performance.\n" +
      "- AI tooling: better model routers and eval kits.\n",
  },
  {
    id: "m3",
    role: "user",
    text: "Great. Recommend some feeds to follow?",
  },
  {
    id: "m4",
    role: "assistant",
    text:
      "Absolutely — I’ve picked a few high-signal sources for you. " +
      "You can follow them in one click below.",
  },
]

export const AICopilotMedia: React.FC = () => {
  const [visibleCount, setVisibleCount] = React.useState(0)
  const [showRecommendations, setShowRecommendations] = React.useState(false)

  React.useEffect(() => {
    let disposed = false
    const stepDelays = [0, 900, 1600, 2400] // stagger message reveals
    const timers: number[] = []

    const start = () => {
      setVisibleCount(0)
      setShowRecommendations(false)
      for (let i = 0; i < chatScript.length; i++) {
        timers.push(
          window.setTimeout(() => {
            if (disposed) return
            setVisibleCount((v) => Math.min(v + 1, chatScript.length))
          }, stepDelays[i]),
        )
      }
      // Show recommendations after last message
      const lastMessageDelay = stepDelays[chatScript.length - 1] || 2400
      timers.push(
        window.setTimeout(() => {
          if (disposed) return
          setShowRecommendations(true)
        }, lastMessageDelay + 800),
      )
    }

    start()
    return () => {
      disposed = true
      for (const t of timers) {
        clearTimeout(t)
      }
    }
  }, [])

  const messagesToRender = chatScript.slice(0, visibleCount)
  const lastVisible = messagesToRender.at(-1)

  return (
    <div className="flex size-full flex-col gap-4 p-6">
      <Header />

      <ScrollArea
        flex
        rootClassName="-mx-6 -mb-6 flex min-h-0 flex-1"
        viewportClassName="flex-col gap-4 pb-6 px-6"
      >
        <ChatPreview
          messages={messagesToRender}
          streamingId={lastVisible?.id}
          showRecommendations={showRecommendations}
        />
      </ScrollArea>
    </div>
  )
}

const Header: React.FC = () => {
  return (
    <m.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={Spring.smooth(0.4)}
      className="relative"
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AI Icon with glow effect */}
          <m.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={Spring.bouncy(0.5, 0.1)}
          >
            <AISpline className="size-8" />
          </m.div>

          {/* Text content */}
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={Spring.snappy(0.4)}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2">
              <Folo className="size-7" />
              <span className="text-sm font-semibold text-text">AI</span>
            </div>
            <span className="text-xs text-text-secondary">
              Summarize, search, and curate for you
            </span>
          </m.div>
        </div>
      </div>
    </m.div>
  )
}

const ChatPreview: React.FC<{
  messages: PreviewMessage[]
  streamingId?: string
  showRecommendations?: boolean
}> = ({ messages, streamingId, showRecommendations }) => {
  const feeds = React.useMemo(
    () => [
      {
        id: "vercel-blog",
        type: "feed" as const,
        title: "Vercel Blog",
        url: "https://vercel.com/blog",
        siteUrl: "https://vercel.com",
        description: "Frontend, AI, and infra updates.",
      },
      {
        id: "react",
        type: "feed" as const,
        title: "React",
        url: "https://react.dev/blog",
        siteUrl: "https://react.dev",
        description: "Official updates and releases.",
      },
      {
        id: "ai-engineering",
        type: "feed" as const,
        title: "AI Engineering",
        url: "https://aie.sh",
        siteUrl: "https://aie.sh",
        description: "Practical AI for builders.",
      },
    ],
    [],
  )

  return (
    <div className="relative flex min-h-[240px] flex-1 flex-col overflow-hidden">
      <div className="relative flex-1">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user"
            const delay = index * 0.1

            return (
              <m.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={Spring.snappy(0.5, 0.05)}
                className={cn("flex", isUser ? "justify-end" : "justify-start")}
                style={{
                  animationDelay: `${delay}s`,
                }}
              >
                <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
                  {/* Message bubble */}
                  <m.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={Spring.smooth(0.4)}
                    className={cn(
                      "group relative max-w-[85%] overflow-hidden rounded-2xl",
                      isUser ? "border-fill bg-fill/50" : "border-fill/30 shadow-sm",
                    )}
                  >
                    <div className="relative px-3.5 py-2.5">
                      {isUser ? (
                        <UserMessageParts message={buildUserBizMessage(message.id, message.text)} />
                      ) : (
                        <>
                          <AIMarkdownStreamingMessage
                            text={message.text}
                            isStreaming={message.id === streamingId}
                            className="text-text"
                          />
                        </>
                      )}
                    </div>
                  </m.div>
                </div>
              </m.div>
            )
          })}

          {/* Recommendations section - appears after conversation */}
          {showRecommendations && (
            <m.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={Spring.smooth(0.5)}
              className="mt-2"
            >
              {/* AI Avatar + Recommendation Card Container */}
              <div className="flex gap-2">
                {/* Recommendation Cards */}
                <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-fill/30 shadow-sm">
                  {/* Header */}
                  <div className="border-b border-fill/20 bg-gradient-to-r from-orange/5 via-pink/5 to-purple/5 px-3 py-2.5">
                    <m.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={Spring.snappy(0.4)}
                      className="flex items-center gap-2"
                    >
                      <m.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: "easeInOut",
                        }}
                      >
                        <i className="i-mingcute-sparkles-2-line size-4 text-orange" />
                      </m.div>
                      <span className="text-xs font-semibold text-text">Recommended Feeds</span>
                    </m.div>
                  </div>

                  {/* Feed cards */}
                  <div className="min-w-0 divide-y divide-fill/10 p-2">
                    {feeds.map((feed, index) => (
                      <m.div
                        key={feed.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={Spring.snappy(0.4, 0.05)}
                        style={{
                          animationDelay: `${index * 0.15}s`,
                        }}
                        whileHover={{ scale: 1.005 }}
                        className="group relative overflow-hidden rounded-lg p-2.5 transition-colors hover:bg-material-thin/50"
                      >
                        {/* Icon with gradient background */}
                        <div className="relative flex items-start gap-2.5">
                          <m.div
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fill to-fill-secondary ring-1 ring-fill/50"
                          >
                            <i className="i-mingcute-rss-line size-4 text-text" />
                          </m.div>

                          <div className="min-w-0 flex-1">
                            {/* Feed title */}
                            <h4 className="mb-0.5 truncate text-xs font-semibold text-text">
                              {feed.title}
                            </h4>
                            {/* Feed description */}
                            <p className="mb-1 line-clamp-2 text-[11px] leading-snug text-text-secondary">
                              {feed.description}
                            </p>
                            {/* URL hint */}
                            <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                              <i className="i-mgc-link-cute-re size-2.5" />
                              <span className="truncate">{feed.siteUrl}</span>
                            </div>
                          </div>
                        </div>
                      </m.div>
                    ))}
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </div>
      </div>
    </div>
  )
}
