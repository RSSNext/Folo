import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { cn } from "@follow/utils/utils"

import { readableContentMaxWidthClassName } from "~/constants/ui"

const PRINT_HOMEPAGE = "https://folo.is"
const PRINT_HOMEPAGE_LABEL = "folo.is"

export const EntryPrintHeader = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (state) => ({
    feedId: state.feedId,
    inboxId: state.inboxHandle,
  }))

  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId)
  const sourceTitle = feed?.title || inbox?.title

  return (
    <div className={cn("hidden print:block", readableContentMaxWidthClassName, "mx-auto px-4")}>
      <div className="mb-8 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Logo className="size-4 shrink-0" />
            <Folo className="h-4 w-auto shrink-0 text-text" />
          </div>

          <a
            href={PRINT_HOMEPAGE}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-text-secondary no-underline"
          >
            {PRINT_HOMEPAGE_LABEL}
          </a>
        </div>

        <div className="mt-3 space-y-1.5">
          <p className="text-sm font-medium text-text-secondary">
            The AI Reader that reads the internet for you
          </p>
          {sourceTitle ? (
            <p className="text-sm text-text-secondary">Source: {sourceTitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
