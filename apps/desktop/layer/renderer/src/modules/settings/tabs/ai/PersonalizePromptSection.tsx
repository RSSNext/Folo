import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { TextArea } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { AnimatePresence } from "motion/react"
import * as React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"
import { m } from "~/components/common/Motion"

import { SettingDescription } from "../../control"
import { SettingModalContentPortal } from "../../modal/layout"

export const PersonalizePromptSection = () => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const [prompt, setPrompt] = useState(aiSettings.personalizePrompt)
  const [isSaving, setIsSaving] = useState(false)

  const MAX_CHARACTERS = 500
  const currentLength = prompt.length
  const isOverLimit = currentLength > MAX_CHARACTERS
  const hasChanges = prompt !== aiSettings.personalizePrompt

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    // Allow typing but show validation error if over limit
    setPrompt(value)
  }

  const handleSave = async () => {
    if (isOverLimit) {
      toast.error(`Prompt must be ${MAX_CHARACTERS} characters or less`)
      return
    }

    setIsSaving(true)
    try {
      setAISetting("personalizePrompt", prompt)
      toast.success(t("personalize.saved"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-text text-sm font-medium">{t("personalize.prompt.label")}</Label>
        <div className="relative -mx-3">
          <TextArea
            value={prompt}
            onChange={handlePromptChange}
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
            <span className="text-red mt-1 block">
              Prompt exceeds {MAX_CHARACTERS} character limit
            </span>
          )}
        </SettingDescription>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <SettingModalContentPortal>
            <m.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              transition={Spring.presets.snappy}
              className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3"
            >
              <div className="backdrop-blur-background bg-material-medium border-border shadow-perfect flex w-fit max-w-[92%] items-center justify-between gap-3 rounded-full border py-2 pl-5 pr-2">
                <span className="text-text-secondary text-xs sm:text-sm">Unsaved changes</span>
                <Button
                  buttonClassName="bg-accent rounded-full"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isOverLimit}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </m.div>
          </SettingModalContentPortal>
        )}
      </AnimatePresence>
    </div>
  )
}
