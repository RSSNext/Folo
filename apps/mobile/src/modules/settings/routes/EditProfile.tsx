import { withOpacity } from "@follow/utils/src/color"
import { useMutation } from "@tanstack/react-query"
import type { FC } from "react"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"

import { RotateableLoading } from "@/src/components/common/RotateableLoading"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { UIBarButton } from "@/src/components/ui/button/UIBarButton"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListNavigationLink,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { CheckLineIcon } from "@/src/icons/check_line"
import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { EditEmailScreen } from "@/src/screens/(modal)/edit-email"
import { useWhoami } from "@/src/store/user/hooks"
import type { MeModel } from "@/src/store/user/store"
import { userSyncService } from "@/src/store/user/store"
import type { UserProfileEditable } from "@/src/store/user/types"
import { accentColor, useColor } from "@/src/theme/colors"

import { setAvatar } from "../utils"

export const EditProfileScreen = () => {
  const whoami = useWhoami()

  if (!whoami) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Edit Profile" />
      <AvatarSection whoami={whoami} />
      <ProfileForm whoami={whoami} />
    </SafeNavigationScrollView>
  )
}

const AvatarSection: FC<{
  whoami: MeModel
}> = ({ whoami }) => {
  return (
    <View className="mt-6 items-center justify-center">
      <UserAvatar
        image={whoami?.image}
        name={whoami?.name}
        size={80}
        className={!whoami?.name || !whoami.image ? "bg-system-background" : ""}
      />

      <TouchableOpacity className="mt-2" hitSlop={10} onPress={setAvatar}>
        <Text className="text-accent text-lg">Set Avatar</Text>
      </TouchableOpacity>
    </View>
  )
}

const ProfileForm: FC<{
  whoami: MeModel
}> = ({ whoami }) => {
  const [dirtyFields, setDirtyFields] = useState<Partial<UserProfileEditable>>({})

  const { mutateAsync: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      await userSyncService.updateProfile(dirtyFields)
    },
    onSuccess: () => {
      toast.success("Profile updated")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const label = useColor("label")
  const headerRight = useCallback(
    () => (
      <UIBarButton
        label="Save"
        disabled={isPending || Object.keys(dirtyFields).length === 0}
        normalIcon={
          isPending ? (
            <RotateableLoading size={20} color={withOpacity(label, 0.5)} />
          ) : (
            <CheckLineIcon height={20} width={20} />
          )
        }
        onPress={() => {
          updateProfile()
        }}
      />
    ),
    [dirtyFields, isPending, label, updateProfile],
  )

  const navigation = useNavigation()
  return (
    <View className="mt-4">
      <NavigationBlurEffectHeader headerRight={headerRight} title="Edit Profile" />

      <TouchableWithoutFeedback
        onPress={() => {
          KeyboardController.dismiss()
        }}
      >
        <View className="w-full">
          <GroupedInsetListCard>
            <GroupedInsetListCell
              label="Display Name"
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
              <View className="flex-1">
                <PlainTextField
                  className="text-secondary-label w-full flex-1 text-right"
                  value={dirtyFields.name ?? whoami?.name ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({ ...dirtyFields, name: text })
                  }}
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>
          <GroupedOutlineDescription description="This is the name that will be displayed to other users." />

          {/* User name */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListCell label="Handle" leftClassName="flex-none" rightClassName="flex-1">
              <View className="flex-1">
                <PlainTextField
                  className="text-secondary-label w-full flex-1 text-right"
                  value={dirtyFields.handle ?? whoami?.handle ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({ ...dirtyFields, handle: text })
                  }}
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>
          <GroupedOutlineDescription description="Your handle is used to identify you on Folo." />

          {/* Email */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListNavigationLink
              label="Email"
              onPress={() => {
                navigation.presentControllerView(EditEmailScreen)
              }}
              leftClassName="flex-none"
              rightClassName="flex-1"
              postfix={
                <View className="ml-auto flex-row gap-2">
                  <Text className="text-secondary-label">{whoami.email}</Text>
                  {whoami.emailVerified ? (
                    <CheckCircleCuteReIcon height={18} width={18} color={"#00C75F"} />
                  ) : (
                    <CloseCircleFillIcon height={18} width={18} color={"#FF3B30"} />
                  )}
                </View>
              }
            />
          </GroupedInsetListCard>
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}
