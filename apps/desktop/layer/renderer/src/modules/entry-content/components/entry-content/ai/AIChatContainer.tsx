import type { UIMessage } from "@ai-sdk/ui-utils"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import * as React from "react"

import { AIChatContext, AIPanelRefsContext } from "~/modules/ai/chat/__internal__/AIChatContext"

import { AIChatInput } from "./AIChatInput"
import { AIChatMessage } from "./AIChatMessage"

interface AIChatContainerProps {
  disabled?: boolean
  onSendMessage?: (message: string) => void
}

// Welcome screen suggestions
const welcomeSuggestions = [
  {
    icon: "i-mgc-translate-2-cute-re",
    text: "Read a foreign language article with AI",
    action: "translate",
  },
  {
    icon: tw`i-mingcute-mind-map-line`,
    text: "Tidy an article with AI MindMap Action",
    action: "mindmap",
  },

  {
    icon: tw`i-mingcute-comment-2-line`,
    text: "Freely communicate with AI",
    action: "chat",
  },
]

const Welcome = () => {
  const handleSuggestionClick = (_action: string) => {
    // TODO: Implement suggestion click
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {/* AI Icon */}
      <div className="mb-8">
        <div className="from-orange flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br to-red-500 shadow-lg">
          <div className="relative">
            <i className="i-mgc-ai-cute-re size-8 text-white" />
            <div className="from-orange/20 absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br to-red-500/20" />
          </div>
        </div>
      </div>

      {/* Welcome Title */}
      <div className="mb-4 text-center">
        <h2 className="text-text mb-2 text-xl font-semibold">What can I help you with?</h2>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-md">
        {welcomeSuggestions.map((suggestion, index) => (
          <button
            type="button"
            key={index}
            onClick={() => handleSuggestionClick(suggestion.action)}
            className="hover:bg-fill-secondary group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="bg-fill-tertiary group-hover:bg-fill-secondary flex size-10 items-center justify-center rounded-lg transition-colors">
              <i className={`${suggestion.icon} text-text-secondary size-5`} />
            </div>
            <span className="text-text flex-1 text-sm font-medium">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const AIChatContainer: React.FC<AIChatContainerProps> = ({ disabled, onSendMessage }) => {
  const { inputRef } = React.use(AIPanelRefsContext)

  const { messages } = React.use(AIChatContext)

  const handleSendMessage = (message: string) => {
    if (onSendMessage) {
      onSendMessage(message)
    } else {
      // Demo fallback
      console.info("Sending message:", message)
    }
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  // Show welcome screen if no messages
  const showWelcome = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {showWelcome ? (
        <Welcome />
      ) : (
        // Chat messages
        <ScrollArea flex viewportClassName="p-6">
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <AIChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input area */}
      <div className="shrink-0 p-6 pt-4">
        <AIChatInput
          inputRef={inputRef}
          onSend={handleSendMessage}
          disabled={disabled}
          placeholder={showWelcome ? "What are your thoughts?" : "Ask me anything..."}
        />
      </div>
    </div>
  )
}
// Demo placeholder data
export const DEMO_MESSAGES: UIMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Can you summarize the main points from my recent RSS feeds about AI developments?",
    createdAt: new Date("2024-01-15T10:30:00"),
    parts: [],
  },
  {
    id: "2",
    role: "assistant",
    content: `Based on your recent RSS feeds, here are the key AI developments:

## 🚀 Major Breakthroughs
- **OpenAI's GPT-4 Turbo** introduced with improved reasoning capabilities
- **Google's Gemini Ultra** showing competitive performance in multimodal tasks
- **Meta's Code Llama** advancing open-source AI development

## 📊 Industry Trends
- Increased focus on AI safety and alignment research
- Growing adoption of AI in enterprise workflows
- Rising investment in AI infrastructure and tooling

## 🔬 Research Highlights
- New techniques in prompt engineering showing 40% efficiency gains
- Breakthrough in multimodal AI understanding text, images, and code simultaneously
- Advances in AI memory and long-term context handling

Would you like me to dive deeper into any of these topics?`,
    createdAt: new Date("2024-01-15T10:31:00"),
    parts: [],
  },
  {
    id: "3",
    role: "user",
    content: "Tell me more about the prompt engineering techniques",
    createdAt: new Date("2024-01-15T10:32:00"),
    parts: [],
  },
  {
    id: "4",
    role: "assistant",
    content: `Here are the latest prompt engineering techniques that are gaining traction:

## 🎯 Chain-of-Thought (CoT) Prompting
- Break complex problems into step-by-step reasoning
- Example: "Let's think through this step by step..."
- **40% improvement** in logical reasoning tasks

## 🔄 Few-Shot Learning
- Provide 2-3 examples before asking for the task
- Dramatically improves output consistency
- Works particularly well for formatting tasks

## 🎭 Role-Based Prompting
- Assign specific roles: "You are an expert data scientist..."
- Helps AI adopt appropriate tone and expertise level
- Increases relevance of responses

## 🧩 Template Prompting
- Use structured formats with placeholders
- Ensures consistent output structure
- Great for automated workflows

These techniques are being integrated into major AI platforms and showing significant improvements in both accuracy and user satisfaction.`,
    createdAt: new Date("2024-01-15T10:33:00"),
    parts: [],
  },
]
