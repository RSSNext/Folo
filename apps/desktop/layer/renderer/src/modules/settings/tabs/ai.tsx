import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { SettingInput, SettingTextArea } from "../control"
import { createSetting } from "../helper/builder"
import { SettingSectionTitle } from "../section"

const { SettingBuilder } = createSetting(useAISettingValue, setAISetting)

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

          PersonalizePrompt,
        ]}
      />
      <SettingSectionTitle title={t("ai.shortcuts.title")} />
      <AIChatShortcutCard />
    </div>
  )
}

const AIChatShortcutCard = () => {
  return (
    <div className="bg-material-ultra-thin group/card-root relative flex flex-col gap-4 rounded-2xl border p-4 shadow-sm md:p-6">
      <div className="absolute right-0 top-0 opacity-0 transition-opacity duration-200 group-hover/card-root:opacity-100">
        <button
          className="bg-background center flex size-8 -translate-y-1/2 translate-x-1/2 rounded-full border"
          type="button"
          onClick={() => {
            // TODO
          }}
        >
          <i className="i-mgc-close-cute-re" />
        </button>
      </div>
      <SettingInput type="text" value={""} label="Name" onChange={() => {}} vertical />
      <SettingTextArea value={""} label="Prompt" onChange={() => {}} vertical />
    </div>
  )
}

const PersonalizePrompt = () => {
  const { t } = useTranslation("settings")

  return (
    <SettingInput
      type="text"
      className="mt-4"
      value={""}
      label={t("ai.personalize.prompt.label")}
      onChange={() => {}}
      vertical
    />
  )
}
