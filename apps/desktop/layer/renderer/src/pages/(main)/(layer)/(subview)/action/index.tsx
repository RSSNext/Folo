import { repository } from "@pkg"
import { useTranslation } from "react-i18next"

import { ActionSetting } from "~/modules/action/action-setting"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"

export function Component() {
  const { t } = useTranslation("common")

  useSubViewTitle("words.actions")

  return (
    <div className="flex size-full flex-col px-6 py-8">
      {/* Simple Header */}
      <div className="mx-auto mb-8 max-w-6xl text-center">
        <h1 className="text-text mb-4 text-3xl font-bold">{t("words.actions")}</h1>

        {/* Documentation Link */}
        <a
          href={`${repository.url}/wiki/Actions`}
          target="_blank"
          rel="noreferrer"
          className="text-text-secondary hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
        >
          <i className="i-mgc-book-6-cute-re size-4" />
          <span>{t("words.documentation")}</span>
        </a>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl">
        <ActionSetting />
      </div>
    </div>
  )
}
