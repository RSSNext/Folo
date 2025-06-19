import { useChat } from "@ai-sdk/react"
import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { TextArea } from "@follow/components/ui/input/TextArea.js"
import { Popover, PopoverContent, PopoverTrigger } from "@follow/components/ui/popover/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { env } from "@follow/shared/env.desktop"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"
import { PopoverPortal } from "@radix-ui/react-popover"
import { useRef, useState } from "react"

import { whoami } from "~/atoms/user"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { SplitText } from "~/components/ui/split-text"
import { FeedSummary } from "~/modules/discover/FeedSummary"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal"

import { AIIcon } from "../icon"
import { mockShortcuts } from "../mock-data"

export const AIChatPanel = () => {
  const user = whoami()
  const settingModalPresent = useSettingModal()
  const { messages, input, setInput, append, reload, error } = useChat({
    api: `${env.VITE_API_URL}/ai/chat`,
    onError: (error) => {
      console.warn(error)
    },
    credentials: "include",
  })
  const inDialog = messages.length > 0

  return (
    <div className="flex size-full flex-col p-8">
      <div className="flex w-full flex-row justify-between">
        {inDialog && <AIIcon />}
        <div className="flex w-full flex-row justify-end gap-2">
          {inDialog && (
            <Button
              variant="ghost"
              buttonClassName="text-text-secondary text-sm font-normal"
              onClick={() => {}}
            >
              New Chat
            </Button>
          )}
          <Button variant="ghost" buttonClassName="text-text-secondary text-sm font-normal">
            History
          </Button>
          <Button
            variant="ghost"
            buttonClassName="text-text-secondary text-sm font-normal"
            onClick={() => {
              settingModalPresent("ai")
            }}
          >
            Personalize
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "relative mx-auto flex min-h-0 w-full flex-1 flex-col justify-center gap-8",
          !inDialog && "max-w-3xl items-center",
        )}
      >
        {!inDialog && (
          <div className="text-text flex flex-row items-center gap-3 text-2xl font-medium">
            <div>
              <AIIcon />
            </div>
            <SplitText
              delay={10}
              duration={2}
              ease="elastic.out(1, 0.3)"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              splitType="words"
              text={`Hi ${user?.name}, how may I assist you today?`}
            />
          </div>
        )}
        {inDialog && (
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
        )}
        <AIChatInput
          hideIcon
          onSubmit={(value) => {
            append({
              role: "user",
              content: value,
            })
          }}
          input={input}
          setInput={setInput}
        />
        {!inDialog && (
          <div className="mb-16 w-full pl-5">
            <Popover modal>
              <PopoverTrigger>
                <Button variant="ghost" buttonClassName="text-sm font-normal -ml-3">
                  <div className="flex items-center gap-1">
                    <i className="i-mgc-question-cute-re" />
                    <span>What can I do for you?</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent>
                  <ul className="flex flex-col gap-3 p-4 text-sm text-gray-500">
                    <li className="text-text font-medium">My unread items</li>
                    <li>🧠 Organize all unread items into a mind map.</li>
                    <li>
                      ✂️ According to my reading habits and interests, reduce unread items to less
                      than 100.
                    </li>
                    <li>🌟 Highlight unread items containing "OpenAI" in their content.</li>
                    <Divider className="my-1 w-20" />
                    <li className="text-text font-medium">My subscriptions</li>
                    <li>
                      🖼️ Summarize my starred items from the past week and make it into a poster.
                    </li>
                    <li>📑 Create a timeline of AI-related content.</li>
                    <Divider className="my-1 w-20" />
                    <li className="text-text font-medium">Everything on Folo</li>
                    <li>💡 Generate a list of technology podcasts.</li>
                    <li>📊 Compare the crypto market sentiment this week with last week.</li>
                    <li>🔍 Which podcasts have recently mentioned OpenAI's o3 model?</li>
                  </ul>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        )}
      </div>
    </div>
  )
}

export const AIChatInput = ({
  entryId,
  autoShrink,
  hideIcon,
  onSubmit,
  input,
  setInput,
}: {
  entryId?: string
  autoShrink?: boolean
  hideIcon?: boolean
  onSubmit?: (value: string) => void
  input?: string
  setInput?: (value: string) => void
}) => {
  const entryTitle = useEntry(entryId, (state) => state.title)

  const [isShrink, setIsShrink] = useState(autoShrink)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (value: string) => {
    if (textareaRef.current) {
      onSubmit?.(value)
      textareaRef.current.value = ""
    }
  }

  return (
    <div className="relative flex w-full flex-row gap-2">
      {!hideIcon && (
        <div className="center h-14">
          <AIIcon />
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-2">
        <TextArea
          value={input}
          onChange={(e) => {
            setInput?.(e.target.value)
          }}
          rows={isShrink ? 1 : undefined}
          ref={textareaRef}
          autoHeight
          wrapperClassName={cn(
            "w-full bg-background/80 backdrop-blur-lg shadow-context-menu h-auto",
            !isShrink && "pb-12",
          )}
          placeholder="Describe a task or ask a question"
          rounded="3xl"
          className={cn("px-5 focus:!bg-transparent", !isShrink && "pb-0")}
          onFocus={() => {
            setIsShrink(false)
          }}
        >
          {!isShrink && (
            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between leading-none">
              <div className="flex flex-1 flex-row items-center gap-3 text-sm">
                <Select defaultValue={entryTitle ? "entry" : "unread"}>
                  <SelectTrigger className="h-7 w-auto max-w-60 rounded-3xl py-0 [&>span]:truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="mt-2 max-w-60 rounded-xl">
                    {!!entryTitle && (
                      <SelectItem
                        className="w-auto rounded-lg pr-6 [&>span]:max-w-full [&>span]:truncate"
                        value="entry"
                      >
                        Current entry: {entryTitle}
                      </SelectItem>
                    )}
                    <SelectItem className="rounded-lg" value="unread">
                      My unread items
                    </SelectItem>
                    <SelectItem className="rounded-lg" value="subscriptions">
                      My subscriptions
                    </SelectItem>
                    <SelectItem className="rounded-lg" value="folo">
                      Everything on Folo
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" buttonClassName="text-text-secondary font-normal shrink-0">
                  @ Mention a date or source
                </Button>
              </div>
              <div className="flex flex-row items-center gap-3">
                <i className="i-mgc-mic-cute-re text-xl" />
                <i
                  className="i-mgc-arrow-up-circle-cute-fi text-3xl transition-transform hover:scale-110"
                  onClick={() => {
                    handleSubmit(textareaRef.current?.value ?? "")
                  }}
                />
              </div>
            </div>
          )}
        </TextArea>
        {!isShrink && <AIChatShortcuts className="pl-4" onSubmit={handleSubmit} />}
      </div>
    </div>
  )
}

export const AIChatShortcuts = ({
  className,
  onSubmit,
}: {
  className?: string
  onSubmit?: (value: string) => void
}) => {
  const settingModalPresent = useSettingModal()

  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName={cn("text-text whitespace-nowrap pb-2", className)}
    >
      {mockShortcuts.map((shortcut) => (
        <Button
          key={shortcut.name}
          variant="outline"
          buttonClassName="rounded-full h-7 mr-1"
          size="sm"
          onClick={() => {
            onSubmit?.(shortcut.prompt)
          }}
        >
          {shortcut.name}
        </Button>
      ))}
      <Button
        variant="outline"
        buttonClassName="rounded-full"
        size="sm"
        onClick={() => {
          settingModalPresent("ai")
        }}
      >
        +
      </Button>
    </ScrollArea>
  )
}
