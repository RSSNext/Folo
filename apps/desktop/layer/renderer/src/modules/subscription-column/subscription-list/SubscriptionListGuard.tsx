import type { FeedViewType } from "@follow/constants"
import { cn } from "@follow/utils"

import { SubscriptionList as FeedListDesktop } from "./SubscriptionList"

export const SubscriptionListGuard = function SubscriptionListGuard(props: SubscriptionProps) {
  const { ref, className, view } = props

  if (typeof view !== "number") {
    return null
  }
  return (
    <FeedListDesktop
      className={cn("flex size-full flex-col text-sm", className)}
      view={view}
      ref={ref}
    />
  )
}

export type SubscriptionProps = ComponentType<
  { className?: string; view: FeedViewType } & {
    ref?: React.Ref<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  }
>
