import { m } from "motion/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { AIChatSendButton } from "~/modules/ai/chat/AIChatSendButton"
import { AISpline } from "~/modules/ai/icon"

interface WelcomeScreenProps {
  onSend: (message: string) => void
}

const WelcomeChatInput = ({ onSend }: { onSend: (message: string) => void }) => {
  const [inputValue, setInputValue] = useState("")
  const [isEmpty, setIsEmpty] = useState(true)

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSend(inputValue.trim())
      setInputValue("")
      setIsEmpty(true)
    }
  }, [inputValue, onSend])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    setInputValue(value)
    setIsEmpty(value.trim() === "")
  }, [])

  return (
    <div className="bg-background border-border relative overflow-hidden rounded-2xl border shadow-lg shadow-zinc-100 dark:shadow-black/5">
      <textarea
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Message AI assistant..."
        className="scrollbar-none text-text placeholder:text-text-secondary max-h-40 min-h-14 w-full resize-none bg-transparent px-5 py-3.5 pr-14 text-sm !outline-none transition-all duration-200"
        rows={1}
        autoFocus
      />
      <div className="absolute right-3 top-3">
        <AIChatSendButton onClick={handleSend} disabled={isEmpty} size="sm" />
      </div>
    </div>
  )
}

export const WelcomeScreen = ({ onSend }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-6">
          <div className="mx-auto size-16">
            <AISpline />
          </div>
          <div className="space-y-2">
            <h1 className="text-text text-2xl font-semibold">{APP_NAME} AI</h1>
            <p className="text-text-secondary text-sm">{t("welcome_description")}</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <WelcomeChatInput onSend={onSend} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            "Analyze my reading patterns",
            "Summarize recent articles",
            "Find trending topics",
            "Organize my feeds",
          ].map((suggestion, index) => (
            <m.button
              key={suggestion}
              className="bg-material-medium hover:bg-material-thick border-border text-text-secondary hover:text-text rounded-full border px-4 py-2 text-xs transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSend(suggestion)}
            >
              {suggestion}
            </m.button>
          ))}
        </div>
      </div>
    </div>
  )
}
