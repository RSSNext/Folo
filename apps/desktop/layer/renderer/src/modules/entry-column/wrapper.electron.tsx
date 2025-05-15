import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType, views } from "@follow/constants"
import { cn } from "@follow/utils/utils"

import { useIsZenMode } from "~/atoms/settings/ui"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import type { EntryColumnWrapperProps } from "./wrapper.shared"
import { animationStyles, styles } from "./wrapper.shared"

export const EntryColumnWrapper = ({ ref, children, onScroll }: EntryColumnWrapperProps) => {
  const view = useRouteParamsSelector((state) => state.view)

  const isZenMode = useIsZenMode()

  return (
    <div className={cn(styles, animationStyles, view !== FeedViewType.SocialMedia && "mt-2")}>
      <ScrollArea
        scrollbarClassName={cn(!views[view]!.wideMode ? "w-[5px] p-0" : "", "z-[3]")}
        mask={false}
        ref={ref}
        rootClassName={cn(
          "h-full",
          views[view]!.wideMode ? "mt-2" : "",
          isZenMode ? "max-w-[80ch] mx-auto" : "",
        )}
        viewportClassName={cn(
          "[&>div]:grow flex",
          // avoid ActionBar being cut off
          view === FeedViewType.SocialMedia && "pt-6",
        )}
        onScroll={onScroll}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
