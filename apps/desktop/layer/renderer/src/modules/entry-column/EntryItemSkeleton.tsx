import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import { memo } from "react"

import { getSkeletonItemComponentByView } from "./Items/getSkeletonItemComponentByView"
import { girdClassNames } from "./styles"

const LoadingCircleFallback = (
  <div className="center mt-2">
    <LoadingCircle size="medium" />
  </div>
)
export const EntryItemSkeleton: FC<{
  view: FeedViewType
  count?: number
}> = memo(({ view, count = 10 }) => {
  const SkeletonItem = getSkeletonItemComponentByView(view)

  if (!SkeletonItem) {
    return LoadingCircleFallback
  }

  if (count === 1) {
    return SkeletonItem
  }

  return (
    <div className={cn(views[view]!.gridMode ? girdClassNames : "flex flex-col")}>
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- index is unique
        <div key={index}>{SkeletonItem}</div>
      ))}
    </div>
  )
})
