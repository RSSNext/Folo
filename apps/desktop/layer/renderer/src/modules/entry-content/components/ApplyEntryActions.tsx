import { useEntry } from "@follow/store/entry/hooks"
import { useEffect } from "react"

import { enableShowSourceContent } from "~/atoms/source-content"
import { enableEntryReadability } from "~/hooks/biz/useEntryActions"

/**
 * Handle Entry Actions
 * @returns
 */
export const ApplyEntryActions = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (s) => {
    if (!s.settings) return null
    return {
      readability: s.settings.readability,
      sourceContent: s.settings.sourceContent,
      url: s.url,
    }
  })

  return (
    <>
      {entry?.sourceContent && <ViewSourceContentAutoToggleEffect id={entryId} />}
      {entry?.readability && <ReadabilityAutoToggleEffect id={entryId} url={entry?.url ?? ""} />}
    </>
  )
}

const ViewSourceContentAutoToggleEffect = ({ id }: { id: string }) => {
  useEffect(() => {
    enableShowSourceContent()
  }, [id])
  return null
}

export const ReadabilityAutoToggleEffect = ({ url, id }: { url: string; id: string }) => {
  useEffect(() => {
    enableEntryReadability({ id, url })
  }, [id, url])

  return null
}
