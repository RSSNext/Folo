import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import type { FeedModel } from "@follow/store/feed/types"
import type { InboxModel } from "@follow/store/inbox/types"
import type { ListModel } from "@follow/store/list/types"
import { cn } from "@follow/utils/utils"

import { useUISettingKey } from "~/atoms/settings/ui"
import { FeedCertification } from "~/modules/feed/feed-certification"
import { getPreferredTitle } from "~/store/feed/hooks"

export const FeedTitle = ({
  feed,
  className,
  titleClassName,
  title,
  style,
}: {
  feed?: FeedModel | ListModel | InboxModel | null
  className?: string
  titleClassName?: string
  title?: string | null
  style?: React.CSSProperties
}) => {
  const hideExtraBadge = useUISettingKey("hideExtraBadge")

  if (!feed) return null

  return (
    <div className={cn("flex select-none items-center truncate", className)} style={style}>
      <EllipsisHorizontalTextWithTooltip className={cn("truncate", titleClassName)}>
        {title || getPreferredTitle(feed)}
      </EllipsisHorizontalTextWithTooltip>
      {!hideExtraBadge && feed.type !== "inbox" && <FeedCertification feed={feed} />}
    </div>
  )
}
