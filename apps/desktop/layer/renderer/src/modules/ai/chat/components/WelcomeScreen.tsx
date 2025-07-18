import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { ChatInput } from "~/modules/ai/chat/components/ChatInput"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { AISpline } from "../../AISpline"

interface WelcomeScreenProps {
  onSend: (message: string) => void
}
const DEFAULT_SHORTCUTS = [
  "Generate today daily report",
  "Analyze my reading patterns",
  "Summarize recent articles",
  "What happened today",
]

export const WelcomeScreen = ({ onSend }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const settingModalPresent = useSettingModal()

  const hasCustomPrompt = aiSettings.personalizePrompt?.trim()
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-6">
          <div className="mx-auto size-16">
            <AISpline />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-text text-2xl font-semibold">{APP_NAME} AI</h1>
            <p className="text-text-secondary text-sm">{t("welcome_description")}</p>
            {hasCustomPrompt && (
              <div className="bg-material-medium border-border mx-auto mt-2 w-full max-w-2xl rounded-lg border p-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="text-text-secondary mb-1 text-xs font-medium">
                    Personal Prompt:
                  </div>
                  <button
                    type="button"
                    onClick={() => settingModalPresent("ai")}
                    className="text-text-tertiary hover:text-text-secondary flex size-5 items-center justify-center rounded transition-colors"
                    title="Edit in Settings"
                  >
                    <i className="i-mgc-edit-cute-re size-3.5" />
                  </button>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">
                  {aiSettings.personalizePrompt}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <ChatInput onSend={onSend} variant="minimal" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Custom shortcuts first */}
          {enabledShortcuts.slice(0, 6).map((shortcut, index) => (
            <m.button
              key={shortcut.id}
              className="bg-material-medium hover:bg-material-thick border-border text-text-secondary hover:text-text whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSend(shortcut.prompt)}
              title={shortcut.hotkey ? `${shortcut.name} (${shortcut.hotkey})` : shortcut.name}
            >
              {shortcut.name}
            </m.button>
          ))}

          {/* Default suggestions if no custom shortcuts or to fill remaining space */}
          {enabledShortcuts.length < 4 &&
            DEFAULT_SHORTCUTS.slice(0, 4 - enabledShortcuts.length).map((suggestion, index) => (
              <m.button
                key={suggestion}
                className="bg-material-medium hover:bg-material-thick border-border text-text-secondary hover:text-text whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (enabledShortcuts.length + index) * 0.1 }}
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
