import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import type { FeedOrListRespModel } from "@follow/models/types"
import { cn } from "@follow/utils/utils"

import { useUISettingKey } from "~/atoms/settings/ui"
import { BoostCertification } from "~/modules/boost/boost-certification"
import { FeedCertification } from "~/modules/feed/feed-certification"
import { getPreferredTitle } from "~/store/feed/store"

export const FeedTitle = ({
  feed,
  className,
  titleClassName,
  title,
  style,
}: {
  feed: FeedOrListRespModel | null
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
        {getPreferredTitle(feed) || title}
        {/* {title?.repeat(222)} */}
      </EllipsisHorizontalTextWithTooltip>
      {!hideExtraBadge && (
        <>
          <FeedCertification feed={feed} />
          <BoostCertification feed={feed} />
        </>
      )}
    </div>
  )
}
