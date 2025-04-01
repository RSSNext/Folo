import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import { FeedViewType, views } from "@follow/constants"
import type { EntryModelSimple, FeedModel } from "@follow/models"
import { cn } from "@follow/utils/utils"
import { cloneElement, forwardRef } from "react"

import { useI18n } from "~/hooks/common"

import { EntryItemSkeleton } from "../entry-column/item"
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

  return (
    <Card>
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
                "hover:text-theme-foreground dark:hover:text-white",
                view.peerClassName,
                "center flex h-10 flex-col text-xs leading-none opacity-80 duration-200",
                "text-neutral-800 dark:text-zinc-200",
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
      {!!feed && !!entries ? (
        <CardContent className="space-y-2 p-2">
          {entries.slice(0, 2).map((entry) => (
            <EntryItemStateless entry={entry} feed={feed} view={view} key={entry.guid} />
          ))}
        </CardContent>
      ) : (
        <EntryItemSkeleton view={view ?? FeedViewType.Articles} count={2} />
      )}
    </Card>
  )
})
