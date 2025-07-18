import { FeedViewType, views } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import { AnimatePresence, m } from "motion/react"
import { memo } from "react"

import { useUISettingKey } from "~/atoms/settings/ui"

import { EntryHeaderActions } from "../../actions/header-actions"
import { MoreActions } from "../../actions/more-actions"
import { useEntryContentScrollToTop, useEntryTitleMeta } from "../../atoms"
import { EntryReadHistory } from "../entry-read-history"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ view, entryId, className, compact }: EntryHeaderProps) {
  const entry = useEntry(entryId, () => ({}))
  const entryTitleMeta = useEntryTitleMeta()
  const isAtTop = useEntryContentScrollToTop()

  const hideRecentReader = useUISettingKey("hideRecentReader")

  const shouldShowMeta = !isAtTop && !!entryTitleMeta?.title

  if (!entry) return null

  return (
    <div
      data-hide-in-print
      className={cn(
        "zen-mode-macos:ml-margin-macos-traffic-light-x text-text-secondary relative flex min-w-0 items-center justify-between gap-3 overflow-hidden text-lg duration-200",
        shouldShowMeta && "border-border border-b",
        className,
      )}
    >
      {!hideRecentReader && (
        <div
          className={cn(
            "zen-mode-macos:left-12 text-body absolute left-5 top-0 flex h-full items-center gap-2 leading-none",
            "visible z-[11]",
            views[view]!.wideMode && "static",
            shouldShowMeta && "hidden",
          )}
        >
          <EntryReadHistory entryId={entryId} />
        </div>
      )}
      <div
        className="relative z-10 flex w-full items-center justify-between gap-3"
        data-hide-in-print
      >
        <div className="flex min-w-0 shrink grow">
          <AnimatePresence>
            {shouldShowMeta && (
              <m.div
                initial={{ opacity: 0.01, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.01, y: 30 }}
                className="text-text text-title3 flex min-w-0 shrink items-end gap-2 truncate leading-tight"
              >
                <span className="min-w-[50%] shrink truncate font-bold">
                  {entryTitleMeta.title}
                </span>
                <i className="i-mgc-line-cute-re text-text-secondary size-[10px] shrink-0 translate-y-[-3px] rotate-[-25deg]" />
                <span className="text-text-secondary text-headline shrink -translate-y-px truncate">
                  {entryTitleMeta.description}
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {view !== FeedViewType.SocialMedia && (
          <div className="relative flex shrink-0 items-center justify-end gap-2">
            <EntryHeaderActions entryId={entryId} view={view} compact={compact} />
            <MoreActions entryId={entryId} view={view} />
          </div>
        )}
      </div>
    </div>
  )
}

export const EntryHeader = memo(EntryHeaderImpl)
