import { FeedViewType } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { AnimatePresence, LayoutGroup, m } from "motion/react"
import * as React from "react"

import { CollapseGroup } from "~/components/ui/collapse"
import { PeekModalBaseButton } from "~/components/ui/modal/components/base"
import { ROUTE_FEED_PENDING } from "~/constants"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { DayOf } from "~/modules/ai/ai-daily/constants"
import { DailyItem } from "~/modules/ai/ai-daily/daily"
import { EntryPlaceholderDaily } from "~/modules/ai/ai-daily/EntryPlaceholderDaily"
import type { DailyView } from "~/modules/ai/ai-daily/types"
import { EntryPlaceholderLogo } from "~/modules/entry-content/components/EntryPlaceholderLogo"

import type { EntryContentPlaceholderContextValue } from "./EntryContentPlaceholderContext"
import { EntryContentPlaceholderContext } from "./EntryContentPlaceholderContext"

export const EntryContentPlaceholder = () => {
  const { feedId, view } = useRouteParams()

  const ctxValue = React.useMemo<EntryContentPlaceholderContextValue>(
    () => ({
      openedSummary: atom<null | DayOf>(null),
    }),
    [],
  )

  const openedSummary = useAtomValue(ctxValue.openedSummary)
  return (
    <LayoutGroup>
      <EntryContentPlaceholderContext.Provider value={ctxValue}>
        <AnimatePresence>
          {openedSummary === null ? (
            <m.div
              className="center size-full flex-col"
              initial={{ opacity: 0.01, y: 300 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EntryPlaceholderLogo />
              {feedId === ROUTE_FEED_PENDING && view === FeedViewType.Articles && (
                <EntryPlaceholderDaily view={view} />
              )}
            </m.div>
          ) : (
            <SummaryDetailContent />
          )}
        </AnimatePresence>
      </EntryContentPlaceholderContext.Provider>
    </LayoutGroup>
  )
}

const SummaryDetailContent = () => {
  const { view } = useRouteParams()
  const ctxValue = React.useContext(EntryContentPlaceholderContext)
  const openedSummary = useAtomValue(ctxValue.openedSummary)
  const setOpenedSummary = useSetAtom(ctxValue.openedSummary)

  return (
    <>
      <div className="fade-in-0 absolute right-4 top-4 duration-200">
        <PeekModalBaseButton
          icon={<i className="i-mgc-close-cute-re" />}
          label="Back"
          onClick={() => setOpenedSummary(null)}
        />
      </div>

      <CollapseGroup defaultOpenId={`${openedSummary}`}>
        <DailyItem
          isOpened={openedSummary === DayOf.Today}
          onClick={() => {
            if (openedSummary === DayOf.Today) {
              setOpenedSummary(null)
            } else {
              setOpenedSummary(DayOf.Today)
            }
          }}
          day={DayOf.Today}
          view={view as DailyView}
          className={cn(openedSummary === DayOf.Today && "grow", "pt-6")}
        />

        <DailyItem
          isOpened={openedSummary === DayOf.Yesterday}
          onClick={() => {
            if (openedSummary === DayOf.Yesterday) {
              setOpenedSummary(null)
            } else {
              setOpenedSummary(DayOf.Yesterday)
            }
          }}
          day={DayOf.Yesterday}
          view={view as DailyView}
          className={cn(openedSummary === DayOf.Yesterday && "grow", "pt-6")}
        />
      </CollapseGroup>
    </>
  )
}
