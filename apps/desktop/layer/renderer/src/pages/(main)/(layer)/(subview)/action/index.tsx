import { repository } from "@pkg"
import { useTranslation } from "react-i18next"

import { ActionSetting } from "~/modules/action/action-setting"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"

export function Component() {
  const { t } = useTranslation("common")

  useSubViewTitle("words.actions")

  return (
    <div className="-mt-6 flex size-full min-h-[calc(100vh-8rem)] flex-col px-6">
      {/* Simple Header */}
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-text">{t("words.actions")}</h1>

        {/* Documentation Link */}
        <a
          href={`${repository.url}/wiki/Actions`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <i className="i-mgc-book-6-cute-re size-4" />
          <span>{t("words.documentation")}</span>
        </a>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col @container">
        <ActionSetting />
      </div>
    </div>
  )
}
