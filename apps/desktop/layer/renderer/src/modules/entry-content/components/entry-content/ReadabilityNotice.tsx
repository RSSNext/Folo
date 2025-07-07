import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { useEntry } from "@follow/store/entry/hooks"
import { useTranslation } from "react-i18next"

import {
  ReadabilityStatus,
  setReadabilityStatus,
  useEntryInReadabilityStatus,
  useEntryIsInReadability,
} from "~/atoms/readability"

export const ReadabilityNotice = ({ entryId }: { entryId: string }) => {
  const { t } = useTranslation()
  const { t: T } = useTranslation("common")
  const result = useEntry(entryId, (state) => state.readabilityContent)
  const isInReadability = useEntryIsInReadability(entryId)
  const status = useEntryInReadabilityStatus(entryId)

  if (!isInReadability) {
    return null
  }

  return (
    <div className="grow">
      {result ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/30 p-3 text-sm text-blue-700 shadow-sm dark:border-blue-800/30 dark:bg-blue-900/10 dark:text-blue-300">
          <i className="i-mgc-information-cute-re self-baseline text-lg" />
          {t("entry_content.readability_notice")}
        </p>
      ) : (
        <>
          {status === ReadabilityStatus.FAILURE ? (
            <div className="center mt-36 flex flex-col items-center gap-3">
              <i className="i-mgc-warning-cute-re text-red text-4xl" />
              <span className="text-balance text-center text-sm">
                {t("entry_content.fetching_content_failed")}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setReadabilityStatus({
                    [entryId]: ReadabilityStatus.INITIAL,
                  })
                }}
              >
                {T("words.back")}
              </Button>
            </div>
          ) : (
            <div className="center mt-32 flex flex-col gap-2">
              <LoadingWithIcon size="large" icon={<i className="i-mgc-docment-cute-re" />} />
              <span className="text-sm">{t("entry_content.fetching_content")}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
