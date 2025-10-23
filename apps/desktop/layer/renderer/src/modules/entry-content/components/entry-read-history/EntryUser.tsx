import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { TooltipContent, TooltipPortal } from "@follow/components/ui/tooltip/index.jsx"
import { useUserById } from "@follow/store/user/hooks"
import { getAvatarUrl } from "@follow/utils"
import { getNameInitials } from "@follow/utils/cjk"
import { memo } from "react"
import { useTranslation } from "react-i18next"

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
    <div className="no-drag-region center relative cursor-pointer hover:!z-[99999]" ref={ref}>
      <button
        type="button"
        onClick={() => {
          presentUserProfile(userId)
        }}
      >
        <Avatar className="aspect-square size-6 border border-border ring-1 ring-background">
          <AvatarImage src={getAvatarUrl(user)} className="bg-material-ultra-thick" />
          <AvatarFallback className="text-xs">{getNameInitials(user.name || "")}</AvatarFallback>
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
