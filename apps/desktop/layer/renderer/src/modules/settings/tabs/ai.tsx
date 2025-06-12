import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { createSetting } from "../helper/builder"

const { defineSettingItem, SettingBuilder } = createSetting(useAISettingValue, setAISetting)

export const SettingAI = () => {
  const { t } = useTranslation("settings")

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("ai.personalize.title"),
          },

          defineSettingItem("personalizePrompt", {
            label: t("ai.personalize.prompt.label"),
            description: t("ai.personalize.prompt.description"),
            vertical: true,
          }),
        ]}
      />
    </div>
  )
}
