import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { ACTION_LANGUAGE_MAP } from "@follow/shared/language"
import { availableActionMap as availableActionMapOriginal } from "@follow/store/action/constant"
import { useTranslation } from "react-i18next"

import { defaultResources } from "~/@types/default-resource"
import {
  DEFAULT_ACTION_LANGUAGE,
  setGeneralSetting,
  useGeneralSettingKey,
} from "~/atoms/settings/general"

import { setTranslationCache } from "../entry-content/atoms"

export const availableActionMap: typeof availableActionMapOriginal = {
  ...availableActionMapOriginal,
  summary: {
    ...availableActionMapOriginal.summary,
    prefixElement: <AiTargetLanguageSelector />,
  },
  translation: {
    ...availableActionMapOriginal.translation,
    prefixElement: <AiTargetLanguageSelector />,
  },
}

function AiTargetLanguageSelector() {
  const { t } = useTranslation("settings")
  const actionLanguage = useGeneralSettingKey("actionLanguage")

  return (
    <ResponsiveSelect
      size="sm"
      triggerClassName="w-48"
      defaultValue={actionLanguage}
      value={actionLanguage}
      onValueChange={(value) => {
        setGeneralSetting("actionLanguage", value)
        setTranslationCache({})
      }}
      items={[
        { label: t("general.action_language.default"), value: DEFAULT_ACTION_LANGUAGE },
        ...Object.values(ACTION_LANGUAGE_MAP).map((item) => ({
          label: defaultResources[item.value].lang.name,
          value: item.value,
        })),
      ]}
    />
  )
}
