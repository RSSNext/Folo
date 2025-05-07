import { views } from "@follow/constants"
import type { Range } from "@tanstack/react-virtual"
import { useMemo } from "react"
import { useEventCallback } from "usehooks-ts"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { entryActions } from "~/store/entry"

export const useEntryMarkReadHandler = (entriesIds: string[]) => {
  const renderAsRead = useGeneralSettingKey("renderMarkUnread")
  const scrollMarkUnread = useGeneralSettingKey("scrollMarkUnread")
  const feedView = useRouteParamsSelector((params) => params.view)

  const indexKeyIsCalled = useMemo(() => new Set<string>(), [entriesIds])

  const handleRenderAsRead = useEventCallback(
    ({ startIndex, endIndex }: Range, enabled?: boolean) => {
      if (!enabled) return
      if (indexKeyIsCalled.has(`${startIndex}-${endIndex}`)) return
      const idSlice = entriesIds?.slice(startIndex, endIndex)

      indexKeyIsCalled.add(`${startIndex}-${endIndex}`)

      if (!idSlice) return

      batchMarkRead(idSlice)
    },
  )

  return useMemo(() => {
    if (views[feedView]!.wideMode && renderAsRead) {
      return handleRenderAsRead
    }

    if (scrollMarkUnread) {
      return handleRenderAsRead
    }
    return
  }, [feedView, handleRenderAsRead, renderAsRead, scrollMarkUnread])
}

export function batchMarkRead(ids: string[]) {
  const batchLikeIds = [] as [string, string][]
  const entriesId2Map = entryActions.getFlattenMapEntries()
  for (const id of ids) {
    const entry = entriesId2Map[id]

    if (!entry) continue
    const isRead = entry.read
    if (!isRead) {
      batchLikeIds.push([entry.feedId, id])
    }
  }

  if (batchLikeIds.length > 0) {
    for (const [feedId, id] of batchLikeIds) {
      entryActions.markRead({ feedId, entryId: id, read: true })
    }
  }
}
