import { Button } from "@follow/components/ui/button/index.js"
import { useHasEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { FollowAPIError } from "@follow-app/client-sdk"
import { FetchError } from "ofetch"
import { memo, Suspense } from "react"
import { useTranslation } from "react-i18next"

import { EntryNotFound } from "~/components/errors/EntryNotFound"
import { useLoginModal } from "~/hooks/common/useLoginModal"

import { EntryContentLoading } from "./EntryContentLoading"

// Signed out readers get a 401, which no retry can fix
const isUnauthorized = (error: unknown) =>
  (error instanceof FollowAPIError && error.status === 401) ||
  (error instanceof FetchError && error.statusCode === 401)

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
  const presentLoginModal = useLoginModal()

  if (!loadingRemoteEntry && !realEntry) {
    // The server answered without the entry: 404
    if (!error) {
      throw new EntryNotFound()
    }

    // The request failed and there is nothing cached to show
    if (!hasLocalEntry && isUnauthorized(error)) {
      return (
        <div className="center absolute inset-0 flex flex-col gap-3">
          <i className="i-mgc-user-3-cute-re text-4xl text-text-secondary" />
          <span className="text-balance text-center text-sm">
            {t("entry_content.login_required")}
          </span>
          <Button variant="outline" onClick={presentLoginModal}>
            {t("words.login")}
          </Button>
        </div>
      )
    }

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
