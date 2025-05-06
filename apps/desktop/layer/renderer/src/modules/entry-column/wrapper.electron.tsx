import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { views } from "@follow/constants"
import { clsx } from "clsx"

import { useIsZenMode } from "~/atoms/settings/ui"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import type { EntryColumnWrapperProps } from "./wrapper.shared"
import { animationStyles, styles } from "./wrapper.shared"

export const EntryColumnWrapper = ({ ref, children, onScroll }: EntryColumnWrapperProps) => {
  const view = useRouteParamsSelector((state) => state.view)

  const isZenMode = useIsZenMode()

  return (
    <div className={clsx(styles, animationStyles, "mt-2")}>
      <ScrollArea
        scrollbarClassName={clsx(!views[view]!.wideMode ? "w-[5px] p-0" : "", "z-[3]")}
        mask={false}
        ref={ref}
        rootClassName={clsx(
          "h-full",
          views[view]!.wideMode ? "mt-2" : "",
          isZenMode ? "max-w-[80ch] mx-auto" : "",
        )}
        viewportClassName="[&>div]:grow flex"
        onScroll={onScroll}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
