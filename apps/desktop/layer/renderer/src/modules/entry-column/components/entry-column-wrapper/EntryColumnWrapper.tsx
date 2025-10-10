import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { getView } from "@follow/constants"
import { cn } from "@follow/utils/utils"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

import type { EntryColumnWrapperProps } from "./types"

const styles = tw`relative h-0 grow`
const animationStyles = tw`duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-24 f-motion-reduce:animate-none`

export const EntryColumnWrapper = ({ ref, children, onScroll }: EntryColumnWrapperProps) => {
  const view = useRouteParamsSelector((state) => state.view)

  return (
    <div className={cn(styles, animationStyles)}>
      <ScrollArea
        scrollbarClassName={cn(!getView(view)?.wideMode ? "w-[5px] p-0" : "", "z-[3]")}
        mask={false}
        ref={ref}
        rootClassName="h-full"
        viewportClassName={"[&>div]:grow flex"}
        onScroll={onScroll}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
