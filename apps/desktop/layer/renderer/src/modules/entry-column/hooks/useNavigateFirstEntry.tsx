import type { FeedViewType } from "@follow-app/client-sdk"
import { useEffect, useRef } from "react"

import { ROUTE_ENTRY_PENDING } from "~/constants"
import type { NavigateEntryOptions } from "~/hooks/biz/useNavigateEntry"
import { useNewUserGuideState } from "~/modules/app-tip/useNewUserGuideState"

import { useEntriesState } from "../context/EntriesContext"

export const useNavigateFirstEntry = (
  entriesIds: string[],
  activeEntryId: string | undefined,
  view: FeedViewType,
  navigate: (options: NavigateEntryOptions) => void,
) => {
  const state = useEntriesState()
  const isRemoteSource = state.type === "remote"
  const hasAutoNavigatedRef = useRef(false)
  const { shouldShowNewUserGuide } = useNewUserGuideState()
  useEffect(() => {
    if (!shouldShowNewUserGuide) return
    if (!isRemoteSource) return
    if (hasAutoNavigatedRef.current) return
    if (state.isLoading || state.isFetching) return
    if (entriesIds.length === 0) return
    if (activeEntryId && activeEntryId !== ROUTE_ENTRY_PENDING) return

    const firstEntryId = entriesIds[0]
    if (!firstEntryId) return

    hasAutoNavigatedRef.current = true
    navigate({
      view,
      entryId: firstEntryId,
    })
  }, [
    activeEntryId,
    entriesIds,
    navigate,
    shouldShowNewUserGuide,
    state.isFetching,
    state.isLoading,
    view,
    isRemoteSource,
  ])
}
