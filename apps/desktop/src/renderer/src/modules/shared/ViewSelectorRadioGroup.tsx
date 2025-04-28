import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { FeedViewType, views } from "@follow/constants"
import type { EntryModelSimple, FeedModel } from "@follow/models"
import { cn } from "@follow/utils/utils"
import { cloneElement, forwardRef } from "react"

import { useI18n } from "~/hooks/common"

import { EntryItemSkeleton } from "../entry-column/EntryItemSkeleton"
import { EntryItemStateless } from "../entry-column/item-stateless"

export const ViewSelectorRadioGroup = forwardRef<
  HTMLInputElement,
  {
    entries?: EntryModelSimple[]
    feed?: FeedModel
    view?: number
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ entries, feed, view, className, ...rest }, ref) => {
  const t = useI18n()

  const showPreview = feed && entries && entries.length > 0
  const showLoading = !!feed && !showPreview

  return (
    <Card className={rest.disabled ? "pointer-events-none" : void 0}>
      <CardHeader className={cn("grid grid-cols-6 space-y-0 px-2 py-3", className)}>
        {views.map((view) => (
          <div key={view.name}>
            <input
              className="peer hidden"
              type="radio"
              id={view.name}
              value={view.view}
              ref={ref}
              {...rest}
            />
            <label
              htmlFor={view.name}
              className={cn(
                "hover:text-text",
                view.peerClassName,
                "center flex h-10 flex-col text-xs leading-none opacity-80 duration-200",
                "text-text-secondary",
                "peer-checked:opacity-100",
                "whitespace-nowrap",
              )}
            >
              {cloneElement(view.icon, {
                className: `text-lg ${view.icon?.props?.className ?? ""}`,
              })}
              <span className="mt-1 hidden text-xs lg:inline">
                {t(view.name, { ns: "common" })}
              </span>
            </label>
          </div>
        ))}
      </CardHeader>
      {showPreview && (
        <CardContent className="relative h-64 w-full">
          <div className="absolute inset-0">
            <ScrollArea flex rootClassName="h-full" viewportClassName="flex flex-col gap-2">
              {entries.slice(0, 2).map((entry) => (
                <EntryItemStateless entry={entry} feed={feed} view={view} key={entry.guid} />
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      )}
      {showLoading && <EntryItemSkeleton view={view ?? FeedViewType.Articles} count={2} />}
    </Card>
  )
})
