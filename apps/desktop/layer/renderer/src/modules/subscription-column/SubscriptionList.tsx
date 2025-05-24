import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { SubscriptionList as FeedListDesktop } from "./SubscriptionList.electron"
import { SubscriptionList as FeedListMobile } from "./SubscriptionList.mobile"

export const SubscriptionList = withResponsiveSyncComponent(FeedListDesktop, FeedListMobile)

export type SubscriptionProps = ComponentType<
  { className?: string; view: number } & {
    ref?: React.Ref<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  }
>
