import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { TooltipContent, TooltipPortal } from "@follow/components/ui/tooltip/index.jsx"
import { useUserById } from "@follow/store/user/hooks"
import { getNameInitials } from "@follow/utils/cjk"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"

export const EntryUser: Component<{
  userId: string
  ref?: React.Ref<HTMLDivElement>
}> = memo(({ userId, ref }) => {
  const user = useUserById(userId)
  const { t } = useTranslation()
  const presentUserProfile = usePresentUserProfileModal("drawer")
  if (!user) return null
  return (
    <div className="no-drag-region relative cursor-pointer hover:!z-[99999]" ref={ref}>
      <button
        type="button"
        onClick={() => {
          presentUserProfile(userId)
        }}
      >
        <Avatar className="border-border ring-background aspect-square size-7 border ring-1">
          <AvatarImage
            src={replaceImgUrlIfNeed(user?.image || undefined)}
            className="bg-material-ultra-thick"
          />
          <AvatarFallback>{getNameInitials(user.name || "")}</AvatarFallback>
        </Avatar>
      </button>
      <TooltipPortal>
        <TooltipContent side="top">
          {t("entry_actions.recent_reader")} {user.name}
        </TooltipContent>
      </TooltipPortal>
    </div>
  )
})
