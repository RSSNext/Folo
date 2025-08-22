import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"
import { MCPServicesSection } from "./ai/mcp/MCPServicesSection"
import { PanelStyleSection } from "./ai/PanelStyleSection"
import { PersonalizePromptSection } from "./ai/PersonalizePromptSection"
import { AIShortcutsSection } from "./ai/shortcuts/AIShortcutsSection"
import { TokenUsageSection } from "./ai/TokenUsageSection"

const SettingBuilder = createSettingBuilder(useAISettingValue)
const defineSettingItem = createDefineSettingItem(useAISettingValue, setAISetting)

export const SettingAI = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("token_usage.title"),
          },
          TokenUsageSection,
          {
            type: "title",
            value: t("features.title"),
          },

          PanelStyleSection,
          defineSettingItem("autoScrollWhenStreaming", {
            label: t("settings.autoScrollWhenStreaming.label"),
            description: t("settings.autoScrollWhenStreaming.description"),
          }),

          {
            type: "title",
            value: t("personalize.title"),
          },

          PersonalizePromptSection,

          {
            type: "title",
            value: t("shortcuts.title"),
          },
          AIShortcutsSection,

          {
            type: "title",
            value: t("integration.title"),
          },
          MCPServicesSection,
        ]}
      />
    </div>
  )
}
