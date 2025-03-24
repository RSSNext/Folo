import { cn } from "@follow/utils"
import * as Haptics from "expo-haptics"
import type { PropsWithChildren } from "react"
import { useCallback } from "react"
import { TouchableOpacity, View } from "react-native"

import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { UIBarButton } from "@/src/components/ui/button/UIBarButton"
import { AddCuteReIcon } from "@/src/icons/add_cute_re"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { RoundCuteFiIcon } from "@/src/icons/round_cute_fi"
import { RoundCuteReIcon } from "@/src/icons/round_cute_re"
import { Dialog } from "@/src/lib/dialog"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { LoginScreen } from "@/src/screens/(modal)/login"
import { ProfileScreen } from "@/src/screens/(modal)/profile"
import { useWhoami } from "@/src/store/user/hooks"
import { accentColor, useColor } from "@/src/theme/colors"

import { AddFeedDialog } from "../dialogs/AddFeedDialog"
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

export function HomeSharedRightAction(props: PropsWithChildren) {
  return (
    <ActionGroup>
      {props.children}

      <UIBarButton
        label="Mark All as Read"
        normalIcon={<CheckCircleCuteReIcon height={24} width={24} color={accentColor} />}
        onPress={() => {
          Dialog.show(MarkAllAsReadDialog)
        }}
      />
    </ActionGroup>
  )
}

interface HeaderActionButtonProps {
  variant?: "primary" | "secondary"
}

const useButtonVariant = ({ variant = "primary" }: HeaderActionButtonProps) => {
  const label = useColor("label")
  const size = 24
  const color = variant === "primary" ? accentColor : label
  return { size, color }
}
export const UnreadOnlyActionButton = ({ variant = "primary" }: HeaderActionButtonProps) => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const { size, color } = useButtonVariant({ variant })
  return (
    <UIBarButton
      label={unreadOnly ? "Show All" : "Show Unread Only"}
      normalIcon={<RoundCuteReIcon height={size} width={size} color={color} />}
      selectedIcon={<RoundCuteFiIcon height={size} width={size} color={color} />}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setGeneralSetting("unreadOnly", !unreadOnly)
        toast.success(`Showing ${unreadOnly ? "all" : "unread"} entries`, { position: "bottom" })
      }}
      selected={unreadOnly}
      overlay={false}
    />
  )
}

export const AddFeedButton = () => {
  return (
    <UIBarButton
      label="Add Feed"
      normalIcon={<AddCuteReIcon color={accentColor} />}
      onPress={() => {
        Dialog.show(AddFeedDialog)
      }}
    />
  )
}
