import { Label } from "@follow/components/ui/label/index.js"
import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"
import { MCPServicesSection } from "./ai/mcp/MCPServicesSection"
import { UserMemorySection } from "./ai/memory"
import { PanelStyleSection } from "./ai/PanelStyleSection"
import { PersonalizePromptSection } from "./ai/PersonalizePromptSection"
import { AIShortcutsSection } from "./ai/shortcuts/AIShortcutsSection"
import { TaskSchedulingSection } from "./ai/tasks"
import { UsageAnalysisSection } from "./ai/usage"

const SettingBuilder = createSettingBuilder(useAISettingValue)
const defineSettingItem = createDefineSettingItem("ai", useAISettingValue, setAISetting)

export const AI_SETTING_SECTION_IDS = {
  shortcuts: "settings-ai-shortcuts",
  tasks: "settings-ai-tasks",
} as const

export const SettingAI = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("features.title"),
          },

          PanelStyleSection,
          defineSettingItem("showSplineButton", {
            label: t("settings.showSplineButton.label"),
            description: t("settings.showSplineButton.description"),
          }),
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
            id: AI_SETTING_SECTION_IDS.shortcuts,
          },
          AIShortcutsSection,

          {
            type: "title",
            value: t("memories.section.title"),
          },
          UserMemorySection,

          {
            type: "title",
            value: t("tasks.section.title"),
            id: AI_SETTING_SECTION_IDS.tasks,
          },
          TaskSchedulingSection,

          {
            type: "title",
            value: t("integration.title"),
          },
          MCPServicesSection,

          {
            type: "title",
            value: t("usage_analysis.title"),
          },
          UsageAnalysisSection,
          AISecurityDisclosureSection,
        ]}
      />
    </div>
  )
}

const AISecurityDisclosureSection = () => {
  const { t } = useTranslation("ai")

  return (
    <div className="mt-6 border-t border-fill-secondary pt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <i className="i-mgc-safety-certificate-cute-re size-4 text-green" />
          <Label className="text-sm font-medium text-text">
            {t("integration.mcp.security.title")}
          </Label>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          {t("integration.mcp.security.description")}
        </p>
      </div>
    </div>
  )
}
