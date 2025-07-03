import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType, views } from "@follow/constants"
import { cn } from "@follow/utils/utils"

import { useIsZenMode } from "~/atoms/settings/ui"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import type { EntryColumnWrapperProps } from "./types"

const styles = tw`relative h-0 grow`
const animationStyles = tw`duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:animate-none`

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
        viewportClassName={"[&>div]:grow flex"}
        onScroll={onScroll}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
