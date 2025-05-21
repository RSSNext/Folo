import { AvatarGroup } from "@follow/components/ui/avatar-group/index.js"
import { FeedViewType } from "@follow/constants"

import { useWhoami } from "~/atoms/user"
import { getRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common"
import { useAppLayoutGridContainerWidth } from "~/providers/app-grid-layout-container-provider"
import { Queries } from "~/queries"
import { useEntryReadHistory } from "~/store/entry"

import { EntryUser } from "./EntryReadHistory.shared"

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
  const entryHistory = useEntryReadHistory(entryId)

  const inboxId = useRouteParamsSelector((s) => s.inboxId)

  const { data } = useAuthQuery(Queries.entries.entryReadingHistory(entryId), {
    refetchInterval: 1000 * 60,
    enabled: !inboxId,
    refetchIntervalInBackground: false,
  })
  const totalCount = data?.total || 0

  const appGirdContainerWidth = useAppLayoutGridContainerWidth()

  const LIMIT = getLimit(appGirdContainerWidth)

  if (!entryHistory) return null
  if (!me) return null
  if (!entryHistory.userIds) return null

  return (
    <div
      className="animate-in fade-in @md:flex hidden items-center duration-200"
      data-hide-in-print
    >
      <AvatarGroup>
        {entryHistory.userIds
          .filter((id) => id !== me?.id)
          .slice(0, LIMIT)

          .map((userId) => (
            <EntryUser userId={userId} key={userId} />
          ))}
      </AvatarGroup>

      {totalCount > LIMIT && (
        <div
          style={{
            margin: "-8px",
            zIndex: LIMIT + 1,
          }}
          className="no-drag-region border-border bg-material-opaque ring-background relative flex size-7 items-center justify-center rounded-full border ring-2"
        >
          <span className="text-text-secondary text-[10px] font-medium tabular-nums">
            +{Math.min(totalCount - LIMIT, 99)}
          </span>
        </div>
      )}
    </div>
  )
}
