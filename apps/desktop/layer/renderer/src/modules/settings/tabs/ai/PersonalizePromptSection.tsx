import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { LexicalRichEditorTextArea } from "@follow/components/ui/lexical-rich-editor/index.js"
import { AnimatePresence } from "motion/react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"
import { m } from "~/components/common/Motion"
import { MentionPlugin } from "~/modules/ai-chat/editor"

import { SettingDescription } from "../../control"
import { SettingModalContentPortal } from "../../modal/layout"

export const PersonalizePromptSection = () => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const promptRef = useRef("")
  const [isSaving, setIsSaving] = useState(false)
  const [currentLength, setCurrentLength] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)

  const MAX_CHARACTERS = 500
  const isOverLimit = currentLength > MAX_CHARACTERS

  const handleEditorChange = (value: string, textLength: number) => {
    promptRef.current = value
    setCurrentLength(textLength)
    setHasChanges(value !== aiSettings.personalizePrompt)
  }

  const handleSave = async () => {
    if (isOverLimit) {
      toast.error(`Prompt must be ${MAX_CHARACTERS} characters or less`)
      return
    }

    if (!promptRef.current) return

    setIsSaving(true)
    try {
      setAISetting("personalizePrompt", promptRef.current)
      toast.success(t("personalize.saved"))
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative -ml-3">
          <LexicalRichEditorTextArea
            initialValue={aiSettings.personalizePrompt}
            onValueChange={handleEditorChange}
            plugins={[MentionPlugin]}
            namespace="PersonalizePromptEditor"
            placeholder={t("personalize.prompt.placeholder")}
            className={`min-h-[80px] resize-none text-sm ${
              isOverLimit ? "border-red focus:border-red" : ""
            }`}
          />
          <div
            className={`absolute bottom-2 right-2 text-xs ${
              isOverLimit
                ? "text-red"
                : currentLength > MAX_CHARACTERS * 0.8
                  ? "text-yellow"
                  : "text-text-tertiary"
            }`}
          >
            {currentLength}/{MAX_CHARACTERS}
          </div>
        </div>
        <SettingDescription>
          {t("personalize.prompt.help")}
          {isOverLimit && (
            <span className="mt-1 block text-red">
              Prompt exceeds {MAX_CHARACTERS} character limit
            </span>
          )}
        </SettingDescription>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <SettingModalContentPortal>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={Spring.presets.snappy}
              className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3"
            >
              <div
                className="relative overflow-hidden rounded-full backdrop-blur-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "hsl(var(--fo-a) / 0.2)",
                  boxShadow:
                    "0 8px 32px hsl(var(--fo-a) / 0.08), 0 4px 16px hsl(var(--fo-a) / 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Inner glow layer */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.05), transparent, hsl(var(--fo-a) / 0.05))",
                  }}
                />

                {/* Content */}
                <div className="relative flex w-fit max-w-full items-center justify-between gap-3 px-5 py-3">
                  <span className="whitespace-nowrap text-xs text-text-secondary sm:text-sm">
                    Unsaved changes
                  </span>
                  <Button
                    buttonClassName="bg-accent rounded-full"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || isOverLimit}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </m.div>
          </SettingModalContentPortal>
        )}
      </AnimatePresence>
    </div>
  )
}
