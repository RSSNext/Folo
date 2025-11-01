import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import { FeedViewType, getView } from "@follow/constants"
import type { FeedModel } from "@follow/store/feed/types"
import { cn } from "@follow/utils/utils"
import type { ParsedEntry } from "@follow-app/client-sdk"
import { cloneElement, useMemo } from "react"

import { parseView } from "~/hooks/biz/useRouteParams"
import { useTimelineList } from "~/hooks/biz/useTimelineList"
import { useI18n } from "~/hooks/common"

import { EntryItemSkeleton } from "../entry-column/EntryItemSkeleton"
import { EntryItemStateless } from "../entry-column/item-stateless"

export const ViewSelectorRadioGroup = ({
  ref,
  entries,
  feed,
  view,
  className,
  ...rest
}: {
  entries?: ParsedEntry[]
  feed?: FeedModel
  view?: number
} & React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement | null>
  }) => {
  const t = useI18n()

  const timelineViewIds = useTimelineList({ withAll: false, visible: true })
  const configuredViews = useMemo(() => {
    return timelineViewIds
      .map((timelineId) => parseView(timelineId))
      .filter((viewType): viewType is FeedViewType => viewType !== undefined)
      .map((viewType) => getView(viewType))
      .filter((view) => view.switchable)
  }, [timelineViewIds])

  const showPreview = feed && entries && entries.length > 0
  const showLoading = !!feed && !showPreview

  return (
    <Card className={rest.disabled ? "pointer-events-none" : void 0}>
      <CardHeader className={cn("flex flex-row justify-around space-y-0 px-2 py-3", className)}>
        {configuredViews.map((view) => (
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
        <CardContent
          className={
            getView(view || FeedViewType.Articles)?.gridMode
              ? "relative grid w-full grid-cols-3 flex-col gap-2 pb-4"
              : "relative flex w-full flex-col gap-2 pb-0"
          }
        >
          {entries.slice(0, 3).map((entry) => (
            <EntryItemStateless entry={entry} feed={feed} view={view} key={entry.guid} />
          ))}
        </CardContent>
      )}
      {showLoading && <EntryItemSkeleton view={view ?? FeedViewType.Articles} count={2} />}
    </Card>
  )
}
