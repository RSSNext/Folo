import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { usePrefetchUser } from "@follow/store/user/hooks"
import { getColorScheme, stringToHue } from "@follow/utils/color"
import { cn } from "@follow/utils/utils"

import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { useSession } from "~/queries/auth"

import type { LoginProps } from "./LoginButton"
import { LoginButton } from "./LoginButton"

export const UserAvatar = ({
  ref,
  className,
  avatarClassName,
  hideName,
  userId,
  enableModal,
  style,
  onClick,
  ...props
}: {
  className?: string
  avatarClassName?: string
  hideName?: boolean
  userId?: string
  enableModal?: boolean
} & LoginProps &
  React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const { session, status } = useSession({
    enabled: !userId,
  })
  const presentUserProfile = usePresentUserProfileModal("drawer")

  const profile = usePrefetchUser(userId)

  if (!userId && status !== "authenticated") {
    return <LoginButton {...props} />
  }

  const renderUserData = userId ? profile.data : session?.user
  const randomColor = stringToHue(renderUserData?.name || "")
  return (
    <div
      style={style}
      ref={ref}
      onClick={(e) => {
        if (enableModal) {
          presentUserProfile(userId)
        }
        onClick?.(e)
      }}
      {...props}
      className={cn(
        "text-text-secondary flex h-20 items-center justify-center gap-2 px-5 py-2 font-medium",
        className,
      )}
    >
      <Avatar
        className={cn(
          "aspect-square h-full w-auto overflow-hidden rounded-full border bg-stone-300",
          avatarClassName,
        )}
      >
        <AvatarImage
          className="animate-in fade-in-0 duration-200"
          src={replaceImgUrlIfNeed(renderUserData?.image || undefined)}
        />
        <AvatarFallback
          style={{ backgroundColor: getColorScheme(randomColor, true).light.accent }}
          className="text-xs text-white"
        >
          {renderUserData?.name?.[0]}
        </AvatarFallback>
      </Avatar>
      {!hideName && <div>{renderUserData?.name}</div>}
    </div>
  )
}

UserAvatar.displayName = "UserAvatar"
