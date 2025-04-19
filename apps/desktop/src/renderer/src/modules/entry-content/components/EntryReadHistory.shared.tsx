import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { FeedViewType } from "@follow/constants"
import { getNameInitials } from "@follow/utils/cjk"
import { m } from "motion/react"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { useUserById } from "~/store/user"

import { usePresentUserProfileModal } from "../../profile/hooks"

export const getLimit = (width: number): number => {
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

export const EntryUserRow: Component<{ userId: string }> = memo(({ userId }) => {
  const user = useUserById(userId)
  const presentUserProfile = usePresentUserProfileModal("drawer")
  if (!user) return null

  return (
    <li
      onClick={() => {
        presentUserProfile(userId)
      }}
      role="button"
      tabIndex={0}
      className="cursor-button hover:bg-muted relative flex min-w-0 max-w-[50ch] shrink-0 items-center gap-2 truncate rounded-md p-1 px-2"
    >
      <Avatar className="border-border ring-background block aspect-square size-7 overflow-hidden rounded-full border ring-1">
        <AvatarImage src={replaceImgUrlIfNeed(user?.image || undefined)} />
        <AvatarFallback>{getNameInitials(user.name || "")}</AvatarFallback>
      </Avatar>

      {user.name && (
        <EllipsisHorizontalTextWithTooltip className="pr-8 text-xs font-medium">
          <span>{user.name}</span>
        </EllipsisHorizontalTextWithTooltip>
      )}
    </li>
  )
})

export const EntryUser: Component<{
  userId: string
  i: number
}> = memo(({ userId, i }) => {
  const user = useUserById(userId)
  const { t } = useTranslation()
  const presentUserProfile = usePresentUserProfileModal("drawer")
  if (!user) return null
  return (
    <Tooltip>
      <TooltipTrigger
        className="no-drag-region relative cursor-pointer"
        style={{
          right: `${i * 8}px`,
          zIndex: i,
        }}
        asChild
      >
        <m.button
          layout="position"
          layoutId={userId}
          type="button"
          onClick={() => {
            presentUserProfile(userId)
          }}
        >
          <Avatar className="border-border ring-background aspect-square size-7 border ring-1">
            <AvatarImage
              src={replaceImgUrlIfNeed(user?.image || undefined)}
              className="bg-theme-placeholder-image"
            />
            <AvatarFallback>{getNameInitials(user.name || "")}</AvatarFallback>
          </Avatar>
        </m.button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="top">
          {t("entry_actions.recent_reader")} {user.name}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
})
