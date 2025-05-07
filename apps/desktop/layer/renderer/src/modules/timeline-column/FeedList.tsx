import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { FeedList as FeedListDesktop } from "./FeedList.electron"
import { FeedList as FeedListMobile } from "./FeedList.mobile"

export const FeedList = withResponsiveSyncComponent(FeedListDesktop, FeedListMobile)

export type FeedListProps = ComponentType<
  { className?: string; view: number } & {
    ref?: React.Ref<HTMLDivElement | null> | ((node: HTMLDivElement | null) => void)
  }
>
