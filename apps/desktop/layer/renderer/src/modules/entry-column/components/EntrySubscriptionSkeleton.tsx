import { cn } from "@follow/utils"
import type { FC } from "react"

import { feedColumnStyles } from "~/modules/subscription-column/styles"

interface EntrySubscriptionSkeletonProps {
  count?: number
  className?: string
}

const EntrySubscriptionSkeletonItem: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(feedColumnStyles.item, "mx-1 w-[calc(100%_-0.5rem)] py-1 pl-2.5", className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {/* Feed icon skeleton */}
        <div className="mt-0.5 size-3.5 shrink-0 rounded-full bg-fill-secondary" />

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title skeleton */}
          <div className="space-y-1">
            <div className="h-3.5 w-full rounded bg-fill-secondary" />
            <div className="h-3.5 w-3/4 rounded bg-fill-secondary" />
          </div>

          {/* Meta info skeleton */}
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-16 rounded bg-fill-tertiary" />
            <div className="size-1 rounded-full bg-fill-tertiary" />
            <div className="h-2.5 w-12 rounded bg-fill-tertiary" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const EntrySubscriptionSkeleton: FC<EntrySubscriptionSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }, (_, i) => (
        <EntrySubscriptionSkeletonItem key={i} />
      ))}
    </div>
  )
}
