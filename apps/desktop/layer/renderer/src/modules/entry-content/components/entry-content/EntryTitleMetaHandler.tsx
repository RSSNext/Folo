import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { useEffect, useLayoutEffect } from "react"

import { useIsSoFWrappedElement } from "~/providers/wrapped-element-provider"

import { setEntryContentScrollToTop, setEntryTitleMeta } from "../../atoms"

export const EntryTitleMetaHandler: Component<{
  entryId: string
}> = ({ entryId }) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { title } = state

    return { feedId, inboxId: inboxHandle, title }
  })

  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId)
  const feedTitle = feed?.title || inbox?.title
  const atTop = useIsSoFWrappedElement()
  useEffect(() => {
    setEntryContentScrollToTop(true)
  }, [entryId])
  useLayoutEffect(() => {
    setEntryContentScrollToTop(atTop)
  }, [atTop])

  useEffect(() => {
    if (entry?.title && feedTitle) {
      setEntryTitleMeta({ title: entry.title, description: feedTitle })
    }
    return () => {
      setEntryTitleMeta(null)
    }
  }, [entryId, entry?.title, feedTitle])
  return null
}
