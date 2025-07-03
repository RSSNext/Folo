import { WEB_BUILD } from "@follow/shared/constants"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { ReadabilityStatus, useEntryInReadabilityStatus } from "~/atoms/readability"
import { useShowSourceContent } from "~/atoms/source-content"

import { ReadabilityAutoToggleEffect } from "../../ApplyEntryActions"

export const EntryNoContent: FC<{
  id: string
  url: string
}> = ({ id, url }) => {
  const status = useEntryInReadabilityStatus(id)
  const showSourceContent = useShowSourceContent()
  const { t } = useTranslation("app")

  if (status !== ReadabilityStatus.INITIAL && status !== ReadabilityStatus.FAILURE) {
    return null
  }
  return (
    <div className="center">
      <div className="space-y-2 text-balance text-center text-sm text-zinc-400">
        {(WEB_BUILD || status === ReadabilityStatus.FAILURE) && (
          <span>{t("entry_content.no_content")}</span>
        )}
        {!showSourceContent && url && <ReadabilityAutoToggleEffect url={url} id={id} />}
      </div>
    </div>
  )
}
