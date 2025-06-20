import type { UseChatHelpers } from "@ai-sdk/react"
import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import { use, useState } from "react"

import { whoami } from "~/atoms/user"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal"

import { AIIcon } from "../icon"
import { AIChatContext } from "./__internal__/AIChatContext"
import { AIChatInput } from "./AIChatInput"
import { AIMessageList } from "./AIMessageList"

// Header component for both states
const ChatHeader = ({ inChat }: { inChat: boolean }) => {
  const settingModalPresent = useSettingModal()

  return (
    <div className="flex w-full flex-row items-center justify-between">
      {inChat && <AIIcon />}
      <div className="flex h-8 w-full flex-row justify-end gap-2">
        {inChat && (
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
  )
}

// Chat input wrapper component
const ChatInputWrapper = ({
  input,
  setInput,
  append,
}: {
  input: string
  setInput: (value: string) => void
  append: UseChatHelpers["append"]
}) => {
  return (
    <AIChatInput
      hideIcon
      autoShrink
      onSubmit={(value) => {
        append({
          role: "user" as const,
          content: value,
        })
      }}
      input={input}
      setInput={setInput}
    />
  )
}

// Welcome screen for new chat
const WelcomeScreen = ({
  input,
  setInput,
  append,
}: {
  input: string
  setInput: (value: string) => void
  append: UseChatHelpers["append"]
}) => {
  const user = whoami()

  return (
    <div className="flex size-full flex-col">
      {/* 顶部问候语 section */}
      <div className="shrink-0 pb-8 pt-16">
        <div className="text-text flex flex-row items-center justify-center gap-3 text-2xl font-medium">
          <div>
            <AIIcon />
          </div>
          <p className="animate-mask-left-to-right !duration-700">
            Hi {user?.name}, how may I assist you today?
          </p>
        </div>
      </div>

      {/* 中间帮助提示区域 - 固定高度避免 CLS */}
      <div className="flex flex-1 items-start justify-center px-8">
        <AIChatHelp onSuggestionClick={setInput} />
      </div>

      {/* 底部输入框 */}
      <div className="shrink-0 px-8 pb-8">
        <div className="mx-auto max-w-3xl">
          <ChatInputWrapper input={input} setInput={setInput} append={append} />
        </div>
      </div>
    </div>
  )
}

// Chat conversation screen
const ConversationScreen = ({
  messages,
  input,
  setInput,
  append,
}: {
  messages: any[]
  input: string
  setInput: (value: string) => void
  append: UseChatHelpers["append"]
}) => {
  return (
    <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col justify-center gap-8">
      <AIMessageList messages={messages} />
      <ChatInputWrapper input={input} setInput={setInput} append={append} />
    </div>
  )
}

export const AIChatPanel = () => {
  const { messages, input, setInput, append } = use(AIChatContext)
  const inChat = messages.length > 0

  // Early return based on chat state
  if (inChat) {
    return (
      <div className="flex size-full flex-col p-8">
        <ChatHeader inChat={true} />
        <ConversationScreen messages={messages} input={input} setInput={setInput} append={append} />
      </div>
    )
  }

  return (
    <div className="flex size-full flex-col p-8">
      <ChatHeader inChat={false} />
      <WelcomeScreen input={input} setInput={setInput} append={append} />
    </div>
  )
}

const AIChatHelp = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const suggestionsData = [
    {
      category: "My unread items",
      icon: "📚",
      suggestions: [
        "🧠 Organize all unread items into a mind map",
        "✂️ According to my reading habits and interests, reduce unread items to less than 100",
        '🌟 Highlight unread items containing "OpenAI" in their content',
      ],
    },
    {
      category: "My subscriptions",
      icon: "⭐",
      suggestions: [
        "🖼️ Summarize my starred items from the past week and make it into a poster",
        "📑 Create a timeline of AI-related content",
      ],
    },
    {
      category: "Everything on Folo",
      icon: "🌐",
      suggestions: [
        "💡 Generate a list of technology podcasts",
        "📊 Compare the crypto market sentiment this week with last week",
        "🔍 Which podcasts have recently mentioned OpenAI's o3 model?",
      ],
    },
  ]

  return (
    <div className="w-full max-w-4xl">
      {/* Header with expand/collapse */}
      <div className="mb-6 flex items-center justify-center">
        <Button
          variant="ghost"
          buttonClassName="text-text-secondary text-sm font-normal hover:text-text transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <i className="i-mgc-question-cute-re text-base" />
            <span>What can I do for you?</span>
            <i
              className={cn(
                "i-mingcute-down-line text-xs transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </Button>
      </div>

      {/* Suggestions Grid */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-32 opacity-60",
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suggestionsData.map((section) => (
            <div
              key={section.category}
              className="bg-fill-vibrant-secondary/50 border-fill-tertiary hover:border-fill-secondary rounded-xl border p-5 backdrop-blur-sm transition-all duration-200"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <h3 className="text-text text-sm font-medium">{section.category}</h3>
              </div>
              <ul className="space-y-3">
                {section.suggestions.map((suggestion, suggestionIndex) => (
                  <li
                    key={suggestionIndex}
                    className="text-text-secondary hover:text-text hover:bg-fill-tertiary/50 cursor-pointer rounded-lg p-2 text-xs leading-relaxed transition-colors"
                    onClick={() => {
                      // Remove emoji and clean the suggestion text
                      const cleanSuggestion = suggestion.replace(
                        /^[\u{1F000}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u,
                        "",
                      )
                      onSuggestionClick(cleanSuggestion)
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {!isExpanded && (
          <div className="mt-4 text-center">
            <div className="text-text-tertiary text-xs">Click above to see more suggestions</div>
          </div>
        )}
      </div>
    </div>
  )
}
