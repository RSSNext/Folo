import { ScrollElementContext } from "@follow/components/ui/scroll-area/ctx.js"
import { views } from "@follow/constants"
import { clsx } from "@follow/utils/utils"
import { useState } from "react"

import { PullToRefresh } from "~/components/ux/pull-to-refresh"
import { ENTRY_COLUMN_LIST_SCROLLER_ID } from "~/constants/dom"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import type { EntryColumnWrapperProps } from "./wrapper.shared"
import { styles } from "./wrapper.shared"

const noop = async () => {}

export const EntryColumnWrapper = ({
  ref,
  children,
  onPullToRefresh,
  onScroll,
}: EntryColumnWrapperProps) => {
  const view = useRouteParamsSelector((state) => state.view)

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  return (
    <div className={clsx(styles, "relative flex flex-col")}>
      <div ref={ref} className={clsx("grow overflow-hidden", views[view]!.wideMode ? "mt-2" : "")}>
        <PullToRefresh className="h-full" onRefresh={onPullToRefresh || noop}>
          <ScrollElementContext value={scrollElement}>
            <div
              className="h-full overflow-y-auto"
              ref={setScrollElement}
              id={ENTRY_COLUMN_LIST_SCROLLER_ID}
              onScroll={onScroll}
            >
              {children}
            </div>
          </ScrollElementContext>
        </PullToRefresh>
      </div>
    </div>
  )
}
