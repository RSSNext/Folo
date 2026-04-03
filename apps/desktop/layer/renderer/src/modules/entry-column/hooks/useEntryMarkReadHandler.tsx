import { getView } from "@follow/constants"
import { entryActions } from "@follow/store/entry/store"
import { unreadSyncService } from "@follow/store/unread/store"
import type { Range } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef } from "react"
import { useEventCallback } from "usehooks-ts"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

type EntryMarkReadHandler = (range: Range, enabled?: boolean) => void

export const useEntryMarkReadHandler = (
  entriesIds: string[],
  { pauseScrollMarkRead = false }: { pauseScrollMarkRead?: boolean } = {},
) => {
  const renderAsRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkUnread = useGeneralSettingKey("scrollMarkUnread")
  const feedView = useRouteParamsSelector((params) => params.view)

  const processedEntryIds = useRef(new Set<string>())

  useEffect(() => {
    processedEntryIds.current.clear()
  }, [entriesIds])

  const handleRangeMarkRead = useEventCallback(
    ({ startIndex, endIndex }: Range, enabled?: boolean) => {
      if (!enabled) return
      const idSlice = entriesIds?.slice(startIndex, endIndex)
      if (!idSlice) return

      // Filter out entries that have already been processed
      const newEntries = idSlice.filter((id) => !processedEntryIds.current.has(id))
      if (newEntries.length === 0) return

      // Mark these entries as processed to avoid duplicate processing
      newEntries.forEach((id) => processedEntryIds.current.add(id))

      batchMarkRead(newEntries)
    },
  )

  const handleScrollMarkRead = useEventCallback((range: Range, enabled?: boolean) => {
    if (pauseScrollMarkRead) return
    handleRangeMarkRead(range, enabled)
  })

  const renderMarkReadHandler = useMemo<EntryMarkReadHandler | undefined>(() => {
    if (!getView(feedView)?.wideMode || !renderAsRead) {
      return
    }

    return handleRangeMarkRead
  }, [feedView, handleRangeMarkRead, renderAsRead])

  const scrollMarkReadHandler = useMemo<EntryMarkReadHandler | undefined>(() => {
    if (!scrollMarkUnread) {
      return
    }

    return handleScrollMarkRead
  }, [handleScrollMarkRead, scrollMarkUnread])

  return useMemo(() => {
    return {
      handleRenderMarkRead: renderMarkReadHandler,
      handleScrollMarkRead: scrollMarkReadHandler,
    }
  }, [renderMarkReadHandler, scrollMarkReadHandler])
}

export function batchMarkRead(ids: string[]) {
  const batchLikeIds = [] as string[]
  const entriesId2Map = entryActions.getFlattenMapEntries()
  for (const id of ids) {
    const entry = entriesId2Map[id]

    if (!entry) continue
    const isRead = entry.read
    if (!isRead && entry.feedId) {
      batchLikeIds.push(id)
    }
  }

  if (batchLikeIds.length > 0) {
    for (const id of batchLikeIds) {
      unreadSyncService.markEntryAsRead(id)
    }
  }
}
