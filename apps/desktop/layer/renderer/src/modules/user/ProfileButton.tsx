import { MdiMeditation } from "@follow/components/icons/Meditation.js"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { UserRole } from "@follow/constants"
import { useMeasure } from "@follow/hooks"
import { useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { repository } from "@pkg"
import type { FC } from "react"
import { memo, useCallback, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import rsshubLogoUrl from "~/assets/rsshub-icon.png?url"
import { useIsInMASReview, useServerConfigs } from "~/atoms/server-configs"
import { useIsZenMode, useSetZenMode } from "~/atoms/settings/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { UrlBuilder } from "~/lib/url-builder"
import { useAchievementModal } from "~/modules/achievement/hooks"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"
import { signOut, useSession } from "~/queries/auth"

import { useActivationModal } from "../activation"
import { COMMAND_ID } from "../command/commands/id"
import { useCommandShortcuts } from "../command/hooks/use-command-binding"
import type { LoginProps } from "./LoginButton"
import { LoginButton } from "./LoginButton"
import { UserAvatar } from "./UserAvatar"
import { UserProBadge } from "./UserProBadge"

const rsshubLogo = new URL(rsshubLogoUrl, import.meta.url).href

export type ProfileButtonProps = LoginProps & {
  animatedAvatar?: boolean
}

export const ProfileButton: FC<ProfileButtonProps> = memo((props) => {
  const serverConfig = useServerConfigs()
  const { status, session } = useSession()
  const { user } = session || {}
  const settingModalPresent = useSettingModal()
  const presentUserProfile = usePresentUserProfileModal("dialog")
  const presentAchievement = useAchievementModal()
  const { t } = useTranslation()

  const [dropdown, setDropdown] = useState(false)

  const navigate = useNavigate()

  const role = useUserRole()
  const presentActivationModal = useActivationModal()
  const zenModeSetting = useIsZenMode()
  const setZenMode = useSetZenMode()
  const isInMASReview = useIsInMASReview()

  const shortcuts = useCommandShortcuts()

  if (status === "unauthenticated") {
    return <LoginButton {...props} />
  }

  return (
    <DropdownMenu onOpenChange={setDropdown}>
      <DropdownMenuTrigger
        asChild
        className="focus-visible:bg-theme-item-hover !outline-none data-[state=open]:bg-transparent"
      >
        {props.animatedAvatar ? (
          <TransitionAvatar stage={dropdown ? "zoom-in" : ""} />
        ) : (
          <UserAvatar hideName className="size-6 p-0 [&_*]:border-0" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="macos:bg-material-opaque min-w-[240px] overflow-visible px-1 pt-6"
        side="bottom"
        align="center"
      >
        <DropdownMenuLabel>
          <div className="text-center leading-none">
            <EllipsisHorizontalTextWithTooltip className="mx-auto max-w-[20ch] truncate text-lg">
              {user?.name}
            </EllipsisHorizontalTextWithTooltip>
            {serverConfig?.REFERRAL_ENABLED ? (
              <UserProBadge
                role={role}
                withText
                className="mt-0.5 w-full justify-center"
                onClick={() => {
                  settingModalPresent("plan")
                }}
              />
            ) : (
              <>
                {!!user?.handle && (
                  <a href={UrlBuilder.profile(user.handle)} target="_blank" className="block">
                    <EllipsisHorizontalTextWithTooltip className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                      @{user.handle}
                    </EllipsisHorizontalTextWithTooltip>
                  </a>
                )}
              </>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="pl-3"
          onClick={() => {
            presentUserProfile(user?.id)
          }}
          icon={<i className="i-mgc-user-3-cute-re" />}
        >
          {t("user_button.profile")}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="pl-3"
          onClick={() => {
            if (role !== UserRole.Trial && role !== UserRole.Free) {
              presentAchievement()
            } else {
              presentActivationModal()
            }
          }}
          icon={<i className="i-mgc-trophy-cute-re" />}
        >
          {t("user_button.achievement")}
        </DropdownMenuItem>

        {!isInMASReview && (
          <DropdownMenuItem
            className="pl-3"
            onClick={() => {
              navigate("/power")
            }}
            icon={<i className="i-mgc-power-outline" />}
          >
            {t("user_button.power")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {!zenModeSetting && (
          <DropdownMenuItem
            className="pl-3"
            onClick={() => {
              setZenMode(true)
            }}
            icon={<MdiMeditation className="size-4" />}
            shortcut={shortcuts[COMMAND_ID.layout.toggleZenMode]}
          >
            {t("user_button.zen_mode")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="pl-3"
          onClick={() => {
            navigate("/action")
          }}
          icon={<i className="i-mgc-magic-2-cute-re" />}
        >
          {t("words.actions")}
        </DropdownMenuItem>
        {!isInMASReview && (
          <DropdownMenuItem
            className="pl-3"
            onClick={() => {
              navigate("/rsshub")
            }}
            icon={<img src={rsshubLogo} className="size-3 grayscale" />}
          >
            {t("words.rsshub")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="pl-3"
          onClick={() => {
            settingModalPresent()
          }}
          icon={<i className="i-mgc-settings-7-cute-re" />}
          shortcut={"$mod+,"}
        >
          {t("user_button.preferences")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!window.electron && (
          <>
            <DropdownMenuItem
              className="pl-3"
              onClick={() => {
                window.open(`${repository.url}/releases`)
              }}
              icon={<i className="i-mgc-download-2-cute-re" />}
            >
              {t("user_button.download_desktop_app")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          className="pl-3"
          onClick={signOut}
          icon={<i className="i-mgc-exit-cute-re" />}
        >
          {t("user_button.log_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
ProfileButton.displayName = "ProfileButton"

const TransitionAvatar = ({
  ref: forwardRef,
  stage,
  ...props
}: {
  stage: "zoom-in" | ""
} & React.HTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement | null>
  }) => {
  const [ref, { x, y }, forceRefresh] = useMeasure()
  const [avatarHovered, setAvatarHovered] = useState(false)

  const zoomIn = stage === "zoom-in"
  const [currentZoomIn, setCurrentZoomIn] = useState(false)
  useLayoutEffect(() => {
    if (zoomIn) {
      setCurrentZoomIn(true)
    }
  }, [zoomIn])

  return (
    <>
      <ActionButton
        {...props}
        ref={forwardRef}
        onMouseEnter={useCallback(() => {
          forceRefresh()
          setAvatarHovered(true)
        }, [forceRefresh])}
        onMouseLeave={useCallback(() => {
          setAvatarHovered(false)
        }, [])}
      >
        <UserAvatar ref={ref} className="h-6 p-0 [&_*]:border-0" hideName />
      </ActionButton>
      {x !== 0 && y !== 0 && (avatarHovered || zoomIn || currentZoomIn) && (
        <RootPortal>
          <UserAvatar
            style={{
              left: x - (zoomIn ? 16 : 0),
              top: y,
            }}
            className={cn(
              "pointer-events-none fixed -bottom-6 p-0 duration-200 [&_*]:border-0",
              "transform-gpu will-change-[left,top,height]",
              zoomIn ? "z-[99] h-14" : "z-[-1] h-6",
            )}
            hideName
            onTransitionEnd={() => {
              if (!zoomIn && currentZoomIn) {
                setCurrentZoomIn(false)
              }
            }}
          />
        </RootPortal>
      )}
    </>
  )
}
