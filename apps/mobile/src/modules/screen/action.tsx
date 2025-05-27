import { getFeed } from "@follow/store/feed/getter"
import { useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import * as Haptics from "expo-haptics"
import type { PropsWithChildren } from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Share, TouchableOpacity, View } from "react-native"

import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { UIBarButton } from "@/src/components/ui/button/UIBarButton"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { RoundCuteFiIcon } from "@/src/icons/round_cute_fi"
import { RoundCuteReIcon } from "@/src/icons/round_cute_re"
import { ShareForwardCuteReIcon } from "@/src/icons/share_forward_cute_re"
import { Dialog } from "@/src/lib/dialog"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { proxyEnv } from "@/src/lib/proxy-env"
import { toast } from "@/src/lib/toast"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"
import { ProfileScreen } from "@/src/screens/(modal)/ProfileScreen"
import { accentColor, useColor } from "@/src/theme/colors"

import { MarkAllAsReadDialog } from "../dialogs/MarkAllAsReadDialog"

export const ActionGroup = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <View className={cn("flex flex-row items-center gap-2", className)}>{children}</View>
}

export function HomeLeftAction() {
  const user = useWhoami()

  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    if (user) {
      navigation.presentControllerView(ProfileScreen, { userId: user.id })
    } else {
      navigation.presentControllerView(LoginScreen)
    }
  }, [navigation, user])

  return (
    <ActionGroup className="ml-2">
      <TouchableOpacity onPress={handlePress}>
        <UserAvatar
          image={user?.image}
          name={user?.name}
          className="rounded-full"
          color={accentColor}
          preview={false}
        />
      </TouchableOpacity>
    </ActionGroup>
  )
}

interface HeaderActionButtonProps {
  variant?: "primary" | "secondary"
}

export const MarkAllAsReadActionButton = ({ variant = "primary" }: HeaderActionButtonProps) => {
  const { t } = useTranslation()
  const { size, color } = useButtonVariant({ variant })

  return (
    <UIBarButton
      label={t("operation.mark_all_as_read")}
      normalIcon={<CheckCircleCuteReIcon height={size} width={size} color={color} />}
      onPress={() => {
        Dialog.show(MarkAllAsReadDialog)
      }}
    />
  )
}

const useButtonVariant = ({ variant = "primary" }: HeaderActionButtonProps) => {
  const label = useColor("label")
  const size = 24
  const color = variant === "primary" ? accentColor : label
  return { size, color }
}
export const UnreadOnlyActionButton = ({ variant = "primary" }: HeaderActionButtonProps) => {
  const { t } = useTranslation()
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const { size, color } = useButtonVariant({ variant })
  return (
    <UIBarButton
      label={
        unreadOnly
          ? t("operation.toggle_unread_only.show_all.label")
          : t("operation.toggle_unread_only.show_unread_only.label")
      }
      normalIcon={<RoundCuteReIcon height={size} width={size} color={color} />}
      selectedIcon={<RoundCuteFiIcon height={size} width={size} color={color} />}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setGeneralSetting("unreadOnly", !unreadOnly)
        toast.success(
          unreadOnly
            ? t("operation.toggle_unread_only.show_all.success")
            : t("operation.toggle_unread_only.show_unread_only.success"),
        )
      }}
      selected={unreadOnly}
      overlay={false}
    />
  )
}

export const FeedShareActionButton = ({
  feedId,
  variant = "primary",
}: { feedId?: string } & HeaderActionButtonProps) => {
  const { t } = useTranslation()
  const { size, color } = useButtonVariant({ variant })

  if (!feedId) return null
  return (
    <UIBarButton
      label={t("operation.share")}
      normalIcon={<ShareForwardCuteReIcon height={size} width={size} color={color} />}
      onPress={() => {
        const feed = getFeed(feedId)
        if (!feed) return
        const url = `${proxyEnv.WEB_URL}/share/feeds/${feedId}`
        Share.share({
          message: `Check out ${feed.title} on Folo: ${url}`,
          title: feed.title!,
          url,
        })
      }}
    />
  )
}
