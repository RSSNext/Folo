import type { UIMessage } from "@ai-sdk/ui-utils"
import { Button } from "@follow/components/ui/button/index.js"
import { use } from "react"

import { Markdown } from "~/components/ui/markdown/Markdown"
import { FeedSummary } from "~/modules/discover/FeedSummary"

import { AIChatContext } from "./__internal__/AIChatContext"

export const AIMessageList = ({ messages }: { messages: UIMessage[] }) => {
  const { error, reload } = use(AIChatContext)
  return (
    <div className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto">
      {messages.map((message) =>
        message.role === "user" ? (
          <div
            key={message.id}
            className="text-text bg-theme-item-active w-fit self-end rounded-2xl px-4 py-2"
          >
            <div>{message.content}</div>
          </div>
        ) : (
          <div key={message.id} className="text-text">
            <Markdown>{message.content}</Markdown>
            <div>
              {message.parts?.map((part) => {
                if (part.type === "tool-invocation") {
                  const { toolName, toolCallId, state } = part.toolInvocation

                  if (state === "result") {
                    if (toolName === "displayFeeds") {
                      const { result } = part.toolInvocation
                      return (
                        <div key={toolCallId} className="my-4 grid grid-cols-2 gap-2">
                          {result.feedList.map((item) => (
                            <FeedSummary
                              key={item.feed.feedId}
                              feed={item.feed}
                              analytics={item.analytics}
                            />
                          ))}
                        </div>
                      )
                    }
                  } else {
                    return (
                      <div key={toolCallId}>
                        {toolName === "displayFeeds" ? <div>Loading feed...</div> : null}
                      </div>
                    )
                  }
                }
                return null
              })}
            </div>
          </div>
        ),
      )}
      {error && (
        <div className="space-y-2 text-red-500">
          <div>An error occurred.</div>
          <Button variant="primary" onClick={() => reload()}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
