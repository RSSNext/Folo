import { usePeekModal } from "~/hooks/biz/usePeekModal"
import { FeedIcon } from "~/modules/feed/feed-icon"

import type { AIDisplayEntriesTool } from "../../store/types"
import { withDisplayStateHandler } from "./share"

type SingleEntry = NonNullable<AIDisplayEntriesTool["output"]>[number]
const AIDisplayEntriesPartBase = ({
  output,
}: {
  output: NonNullable<AIDisplayEntriesTool["output"]>
}) => {
  return output.map((entry) => {
    return <SingleEntryCard key={entry.id} entry={entry} />
  })
}

const SingleEntryCard = ({ entry }: { entry: SingleEntry }) => {
  const peek = usePeekModal()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    peek(entry.id, "modal")
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-material-thick/80 border-border hover:bg-theme-item-hover group relative flex w-full flex-col items-start justify-start overflow-hidden rounded-lg border p-4 backdrop-blur-sm transition-colors"
    >
      {/* Header */}
      <div className="flex w-full items-start justify-between">
        <div className="flex">
          <FeedIcon disableFadeIn entry={null} feed={undefined} siteUrl={entry.url ?? undefined} />
          <h3 className="text-text line-clamp-2 flex-1 font-semibold leading-tight">
            {entry.title || "Untitled Entry"}
          </h3>
        </div>
        <i className="i-mgc-external-link-cute-re text-text-tertiary shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  )
}

export const AIDisplayEntriesPart = withDisplayStateHandler<AIDisplayEntriesTool["output"]>({
  title: "Entries",
  loadingDescription: "Fetching entry data...",
  errorTitle: "Entries Error",
})(AIDisplayEntriesPartBase)
