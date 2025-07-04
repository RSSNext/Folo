import { RadioGroup } from "@follow/components/ui/radio-group/index.js"
import { RadioCard } from "@follow/components/ui/radio-group/RadioCard.js"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { setGeneralSetting } from "~/atoms/settings/general"

type Behavior = "radical" | "balanced" | "conservative"

export function BehaviorGuide() {
  const [value, setValue] = useState<Behavior>("balanced")
  const { t } = useTranslation("app")

  const updateSettings = (behavior: Behavior) => {
    switch (behavior) {
      case "radical": {
        setGeneralSetting("hoverMarkUnread", true)
        setGeneralSetting("scrollMarkUnread", true)
        setGeneralSetting("renderMarkUnread", true)
        break
      }
      case "balanced": {
        setGeneralSetting("hoverMarkUnread", true)
        setGeneralSetting("scrollMarkUnread", true)
        setGeneralSetting("renderMarkUnread", false)
        break
      }
      case "conservative": {
        setGeneralSetting("hoverMarkUnread", false)
        setGeneralSetting("scrollMarkUnread", false)
        setGeneralSetting("renderMarkUnread", false)
        break
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <RadioGroup
          value={value}
          onValueChange={(value) => {
            setValue(value as Behavior)
            updateSettings(value as Behavior)
          }}
        >
          <RadioCard
            wrapperClassName="has-[:checked]:bg-accent has-[:checked]:font-normal rounded-lg border p-3 transition-colors has-[:checked]:text-white"
            label={t("new_user_guide.step.behavior.unread_question.option1")}
            value="radical"
          />
          <RadioCard
            wrapperClassName="has-[:checked]:bg-accent has-[:checked]:font-normal rounded-lg border p-3 transition-colors has-[:checked]:text-white"
            label={t("new_user_guide.step.behavior.unread_question.option2")}
            value="balanced"
          />
          <RadioCard
            wrapperClassName="has-[:checked]:bg-accent has-[:checked]:font-normal rounded-lg border p-3 transition-colors has-[:checked]:text-white"
            label={t("new_user_guide.step.behavior.unread_question.option3")}
            value="conservative"
          />
        </RadioGroup>
      </div>
    </div>
  )
}
