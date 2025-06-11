import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"
import { cn } from "@follow/utils"

import { SubscriptionList as FeedListDesktop } from "./SubscriptionList.electron"
import { SubscriptionList as FeedListMobile } from "./SubscriptionList.mobile"

const SubscriptionListSelector = withResponsiveSyncComponent(FeedListDesktop, FeedListMobile)
export const SubscriptionList = function SubscriptionList(props: SubscriptionProps) {
  const { ref, className, view } = props

  if (typeof view !== "number") {
    return null
  }
  return (
    <SubscriptionListSelector
      className={cn("flex size-full flex-col text-sm", className)}
      view={view}
      ref={ref}
    />
  )
}

export type SubscriptionProps = ComponentType<
  { className?: string; view: number } & {
    ref?: React.Ref<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  }
>
