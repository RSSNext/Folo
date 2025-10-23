import { AvatarGroup } from "@follow/components/ui/avatar-group/index.js"
import { FeedViewType } from "@follow/constants"
import { useEntryReadHistory } from "@follow/store/entry/hooks"
import { useWhoami } from "@follow/store/user/hooks"

import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useAppLayoutGridContainerWidth } from "~/providers/app-grid-layout-container-provider"

import { EntryUser } from "./EntryUser"

const getLimit = (width: number): number => {
  const routeParams = getRouteParams()
  // social media view has four extra buttons
  if (
    [FeedViewType.SocialMedia, FeedViewType.Pictures, FeedViewType.Videos].includes(
      routeParams.view,
    )
  ) {
    if (width > 1100) return 15
    if (width > 950) return 10
    if (width > 800) return 5
    return 3
  }
  if (width > 900) return 15
  if (width > 600) return 10
  return 5
}

export const EntryReadHistory: Component<{ entryId: string }> = ({ entryId }) => {
  const me = useWhoami()
  const data = useEntryReadHistory(entryId)
  const entryHistory = data?.entryReadHistories

  const totalCount = data?.total || 0

  const appGirdContainerWidth = useAppLayoutGridContainerWidth()

  const LIMIT = getLimit(appGirdContainerWidth)

  const placeholder = <div className="-mb-3 h-10" />
  if (!entryHistory) return placeholder
  if (!me) return placeholder

  const displayUsers = entryHistory.userIds.filter((id) => id !== me?.id).slice(0, LIMIT)

  if (displayUsers.length === 0) return placeholder

  return (
    <div
      className="-mb-3 hidden h-10 items-center duration-200 animate-in fade-in @md:flex"
      data-hide-in-print
    >
      <AvatarGroup>
        {displayUsers.map((userId) => (
          <EntryUser userId={userId} key={userId} />
        ))}
      </AvatarGroup>

      {totalCount > LIMIT && (
        <div
          style={{
            margin: "-8px",
            zIndex: LIMIT + 1,
          }}
          className="no-drag-region relative flex size-7 items-center justify-center rounded-full border border-border bg-material-opaque ring-2 ring-background"
        >
          <span className="text-[10px] font-medium tabular-nums text-text-secondary">
            +{Math.min(totalCount - LIMIT, 99)}
          </span>
        </div>
      )}
    </div>
  )
}
