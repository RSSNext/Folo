import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"

import { ListItem } from "~/modules/entry-column/templates/list-item-template"

import { readableContentMaxWidth } from "../styles"
import type { UniversalItemProps } from "../types"

export function AudioItem({ entryId, translation }: UniversalItemProps) {
  return <ListItem entryId={entryId} translation={translation} />
}

AudioItem.wrapperClassName = readableContentMaxWidth

export const AudioItemSkeleton = (
  <div className={`relative mx-auto w-full select-none rounded-md ${readableContentMaxWidth}`}>
    <div className="relative">
      <div className="group relative flex py-4">
        <div className="-mt-0.5 line-clamp-4 flex-1 text-sm leading-tight">
          <div className="flex gap-1 text-[10px] font-bold text-material-opaque">
            <Skeleton className="h-3 w-20" />
            <span>·</span>
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="relative my-0.5 break-words font-medium">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
        <div className="relative ml-2 size-20 shrink-0">
          <Skeleton className="mr-2 size-20 shrink-0 overflow-hidden rounded-sm" />
        </div>
      </div>
    </div>
  </div>
)
