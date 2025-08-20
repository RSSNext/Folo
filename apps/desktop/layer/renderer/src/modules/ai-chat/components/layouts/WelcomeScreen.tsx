import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"

import { useMainEntryId } from "../../hooks/useMainEntryId"
import { DefaultWelcomeContent, EntrySummaryCard } from "../welcome"

interface WelcomeScreenProps {
  onSend: (message: EditorState | string, editor: LexicalEditor | null) => void
}

export const WelcomeScreen = ({ onSend }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()

  const hasEntryContext = !!mainEntryId
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-32">
      <div className="flex w-full max-w-2xl flex-1 flex-col justify-center space-y-8">
        {/* Header Section - Always Present */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto size-16">
            <AISpline />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-text text-2xl font-semibold">{APP_NAME} AI</h1>
            <p className="text-text-secondary text-balance text-sm">
              {hasEntryContext
                ? t("welcome_description_contextual", {
                    defaultValue: "Let's discuss this entry together",
                  })
                : t("welcome_description")}
            </p>
          </div>
        </m.div>

        {/* Dynamic Content Area */}
        <div className="relative flex items-start justify-center">
          <AnimatePresence mode="wait">
            {hasEntryContext ? (
              <EntrySummaryCard
                key="entry-summary"
                entryId={mainEntryId}
                onSend={(message) => onSend(message, null)}
              />
            ) : (
              <DefaultWelcomeContent
                key="default-welcome"
                onSend={onSend}
                shortcuts={enabledShortcuts}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
