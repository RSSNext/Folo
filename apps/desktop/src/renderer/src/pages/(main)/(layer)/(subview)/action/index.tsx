import { useTranslation } from "react-i18next"

import { ActionSetting } from "~/modules/action/action-setting"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"

export function Component() {
  const { t } = useTranslation()

  useSubViewTitle("words.actions")

  return (
    <div className="relative flex w-full flex-col items-center gap-8 px-4 pb-8 lg:pb-4">
      <div className="text-2xl font-bold">{t("words.actions")}</div>
      <ActionSetting />
    </div>
  )
}
