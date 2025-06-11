import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"
import type { FeedViewType } from "@follow/constants"

import { ROUTE_TIMELINE_OF_VIEW } from "~/constants"

import { SubscriptionList as FeedListDesktop } from "./SubscriptionList.electron"
import { SubscriptionList as FeedListMobile } from "./SubscriptionList.mobile"

const SubscriptionListSelector = withResponsiveSyncComponent(FeedListDesktop, FeedListMobile)
export const SubscriptionList = function SubscriptionList({ timelineId }: { timelineId: string }) {
  if (timelineId.startsWith(ROUTE_TIMELINE_OF_VIEW)) {
    const id = Number.parseInt(timelineId.slice(ROUTE_TIMELINE_OF_VIEW.length), 10) as FeedViewType
    return <SubscriptionListSelector className="flex size-full flex-col text-sm" view={id} />
  }
}

export type SubscriptionProps = ComponentType<
  { className?: string; view: number } & {
    ref?: React.Ref<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  }
>
