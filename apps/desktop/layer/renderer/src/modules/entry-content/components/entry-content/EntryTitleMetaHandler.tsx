import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { useEffect } from "react"

import { setEntryTitleMeta } from "../../atoms"

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

  useEffect(() => {
    if (!entry?.feedId) return
    setEntryTitleMeta({
      entryTitle: entry?.title || "",
      feedTitle: feedTitle || "",
      feedId: entry?.feedId || "",
      entryId,
    })

    return () => {
      setEntryTitleMeta(null)
    }
  }, [entryId, entry?.title, feedTitle, entry?.feedId])
  return null
}
