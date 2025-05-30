import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import type { FeedOrListRespModel } from "@follow/models/types"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useBoostModal, useIsFeedBoosted } from "./hooks"

export const BoostCertification = ({
  feed,
  className,
}: {
  feed: FeedOrListRespModel
  className?: string
}) => {
  const showBoostModal = useBoostModal()
  const { t } = useTranslation()
  const isFeedBoosted = useIsFeedBoosted(feed.id)
  if (!isFeedBoosted) return null

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <i
          className={cn(
            "i-mgc-rocket-cute-fi cursor-button text-theme-accent-500 hover:bg-theme-accent-400 ml-1.5 shrink-0",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation()
            showBoostModal(feed.id)
          }}
        />
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent className="px-2 py-1">
          <div className="flex items-center text-sm">
            <i className="i-mgc-rocket-cute-fi text-theme-accent-500 animate-rocket mr-2 shrink-0" />
            {t("boost.feed_being_boosted")}
          </div>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
