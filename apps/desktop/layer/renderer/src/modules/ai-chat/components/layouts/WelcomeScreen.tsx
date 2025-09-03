import { Folo } from "@follow/components/icons/folo.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { clsx } from "@follow/utils"
import type { EditorState, LexicalEditor } from "lexical"
import { AnimatePresence, m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { AISpline } from "~/modules/ai-chat/components/3d-models/AISpline"

import { useMainEntryId } from "../../hooks/useMainEntryId"
import { DefaultWelcomeContent, EntrySummaryCard } from "../welcome"

interface WelcomeScreenProps {
  onSend: (message: EditorState | string, editor: LexicalEditor | null) => void
  centerInputOnEmpty?: boolean
}

export const WelcomeScreen = ({ onSend, centerInputOnEmpty }: WelcomeScreenProps) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()

  const hasEntryContext = !!mainEntryId
  const enabledShortcuts = aiSettings.shortcuts?.filter((shortcut) => shortcut.enabled) || []

  return (
    <ScrollArea
      rootClassName="flex min-h-0 flex-1"
      viewportClassName="px-6 pt-24 flex min-h-0 grow"
      scrollbarClassName="mb-40 mt-12"
      flex
    >
      <div className="flex w-full max-w-2xl flex-1 flex-col justify-center space-y-8 pb-52">
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
            <h1 className="text-text flex items-center justify-center gap-2 text-2xl font-semibold">
              <Folo className="size-11" /> AI
            </h1>
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
        <div
          className={clsx(
            "relative flex items-start justify-center",
            centerInputOnEmpty && "absolute bottom-0 translate-y-40",
          )}
        >
          <AnimatePresence mode="wait">
            {hasEntryContext ? (
              <EntrySummaryCard key="entry-summary" entryId={mainEntryId} />
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
    </ScrollArea>
  )
}
