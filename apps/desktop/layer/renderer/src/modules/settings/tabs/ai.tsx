import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { clsx } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { SettingInput } from "../control"
import { createSetting } from "../helper/builder"
import { SettingSectionTitle } from "../section"

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
      <SettingSectionTitle title={t("ai.shortcuts.title")} />
      <AIChatShortcutCard />
    </div>
  )
}

const AIChatShortcutCard = () => {
  const { t: tCommon } = useTranslation("common")

  return (
    <Card className="group relative mt-4">
      <CardContent className="pb-2">
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={clsx(
              "center bg-background ring-border flex size-6 rounded-full p-1 shadow-sm ring-1",
              "absolute -right-2 -top-2 z-[1] opacity-100 duration-200 hover:!opacity-100 group-hover:opacity-70 lg:opacity-0",
            )}
            onClick={() => {
              // TODO
            }}
          >
            <i className="i-mgc-close-cute-re text-lg" />
            <span className="sr-only">{tCommon("words.delete")}</span>
          </TooltipTrigger>
          <TooltipContent>{tCommon("words.delete")}</TooltipContent>
        </Tooltip>
        <SettingInput
          labelClassName="text-xs"
          type="text"
          className="mt-4"
          value={""}
          label="Name"
          onChange={() => {}}
          vertical
        />
        <SettingInput
          labelClassName="text-xs"
          type="text"
          className="mt-4"
          value={""}
          label="Prompt"
          onChange={() => {}}
          vertical
        />
      </CardContent>
    </Card>
  )
}
