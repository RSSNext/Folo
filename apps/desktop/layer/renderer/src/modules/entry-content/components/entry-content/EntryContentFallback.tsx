import { Button } from "@follow/components/ui/button/index.js"
import { useHasEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { memo, Suspense } from "react"
import { useTranslation } from "react-i18next"

import { EntryNotFound } from "~/components/errors/EntryNotFound"

import { EntryContentLoading } from "./EntryContentLoading"

interface EntryContentFallbackProps {
  entryId: string
  children: React.ReactNode
}

/**
 * Reusable fallback wrapper component that handles:
 * 1. Entry prefetching and 404 detection
 * 2. Suspense fallback with loading state
 * 3. Error boundary for entry not found cases
 */
export const EntryContentFallback = memo(({ entryId, children }: EntryContentFallbackProps) => {
  const { t } = useTranslation()
  const {
    data: realEntry,
    isPending: loadingRemoteEntry,
    error,
    refetch,
    isFetching,
  } = usePrefetchEntryDetail(entryId)
  const hasLocalEntry = useHasEntry(entryId)

  if (!loadingRemoteEntry && !realEntry) {
    // The server answered without the entry: 404
    if (!error) {
      throw new EntryNotFound()
    }

    // The request failed and there is nothing cached to show
    if (!hasLocalEntry) {
      return (
        <div className="center absolute inset-0 flex flex-col gap-3">
          <i className="i-mgc-warning-cute-re text-4xl text-red" />
          <span className="text-balance text-center text-sm">
            {t("entry_content.network_error")}
          </span>
          <Button variant="outline" isLoading={isFetching} onClick={() => refetch()}>
            {t("retry", { ns: "common" })}
          </Button>
        </div>
      )
    }
  }

  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex flex-1 items-center justify-center">
          <EntryContentLoading />
        </div>
      }
    >
      {children}
    </Suspense>
  )
})

EntryContentFallback.displayName = "EntryContentFallback"
