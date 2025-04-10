import { repository } from "@pkg"
import { useTranslation } from "react-i18next"

import { ActionSetting } from "~/modules/action/action-setting"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"

export function Component() {
  const { t } = useTranslation("common")

  useSubViewTitle("words.actions")

  return (
    <div className="relative flex w-full flex-col items-center gap-8 px-4 pb-8 lg:pb-4">
      <div className="text-2xl font-bold">{t("words.actions")}</div>
      <a
        href={`${repository.url}/wiki/Actions`}
        target="_blank"
        rel="noreferrer"
        className="text-accent border-accent flex items-center gap-2 rounded-full border px-2 py-0.5 text-sm"
      >
        <i className="i-mgc-book-6-cute-re" />
        <span>{t("words.documentation")}</span>
      </a>
      <ActionSetting />
    </div>
  )
}
