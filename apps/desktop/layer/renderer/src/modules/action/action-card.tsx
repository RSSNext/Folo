import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { clsx } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { FeedFilter } from "./feed-filter"
import { TargetActionList } from "./target-action-list"

export const ActionCard = ({ index }: { index: number }) => {
  const { t } = useTranslation("common")
  return (
    <Card className="group relative">
      <CardHeader>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={clsx(
              "center bg-background ring-border flex size-6 rounded-full p-1 shadow-sm ring-1",
              "absolute -right-2 -top-2 z-[1] opacity-100 duration-200 hover:!opacity-100 group-hover:opacity-70 lg:opacity-0",
            )}
            onClick={() => {
              actionActions.deleteRule(index)
            }}
          >
            <i className="i-mgc-close-cute-re text-lg" />
            <span className="sr-only">{t("words.delete")}</span>
          </TooltipTrigger>
          <TooltipContent>{t("words.delete")}</TooltipContent>
        </Tooltip>
        <ActionCardToolbar index={index} />
      </CardHeader>
      <CardContent className="flex flex-wrap justify-between gap-y-6">
        <FeedFilter index={index} />
        <TargetActionList index={index} />
      </CardContent>
    </Card>
  )
}

const ActionCardToolbar = ({ index }: { index: number }) => {
  const { t } = useTranslation("settings")

  const name = useActionRule(index, (a) => a.name)
  const disabled = useActionRule(index, (a) => a.result.disabled)

  return (
    <div className="flex w-full items-center gap-3">
      <p className="shrink-0 font-medium text-zinc-500">{t("actions.action_card.name")}</p>
      <Input
        value={name}
        className="h-8 max-w-64"
        onChange={(e) => {
          actionActions.patchRule(index, { name: e.target.value })
        }}
      />
      <div className="grow" />

      <Switch
        checked={!disabled}
        onCheckedChange={(checked) => {
          actionActions.patchRule(index, {
            result: { disabled: !checked },
          })
        }}
      />
    </div>
  )
}
