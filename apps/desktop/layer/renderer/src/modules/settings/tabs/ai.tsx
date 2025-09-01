import { Divider } from "@follow/components/ui/divider/Divider.js"
import { Label } from "@follow/components/ui/label/index.js"
import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"
import { MCPServicesSection } from "./ai/mcp/MCPServicesSection"
import { PanelStyleSection } from "./ai/PanelStyleSection"
import { PersonalizePromptSection } from "./ai/PersonalizePromptSection"
import { AIShortcutsSection } from "./ai/shortcuts/AIShortcutsSection"
import { TaskSchedulingSection } from "./ai/tasks"
import { UsageAnalysisSection } from "./ai/usage"

const SettingBuilder = createSettingBuilder(useAISettingValue)
const defineSettingItem = createDefineSettingItem(useAISettingValue, setAISetting)

export const SettingAI = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          UsageAnalysisSection,
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
          <Divider key="task-scheduling-divider" />,
          {
            type: "title",
            value: "Task Scheduling",
          },
          TaskSchedulingSection,
          AISecurityDisclosureSection,
        ]}
      />
    </div>
  )
}

const AISecurityDisclosureSection = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="border-fill-secondary mt-6 border-t pt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <i className="i-mgc-safety-certificate-cute-re text-green size-4" />
          <Label className="text-text text-sm font-medium">
            {t("integration.mcp.security.title")}
          </Label>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed">
          {t("integration.mcp.security.description")}
        </p>
      </div>
    </div>
  )
}
