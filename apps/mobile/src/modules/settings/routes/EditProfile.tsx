import { useWhoami } from "@follow/store/user/hooks"
import type { MeModel } from "@follow/store/user/store"
import { userSyncService } from "@follow/store/user/store"
import type { UserProfileEditable } from "@follow/store/user/types"
import { useMutation } from "@tanstack/react-query"
import type { FC } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListNavigationLink,
  GroupedInsetListSectionHeader,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { EditEmailScreen } from "@/src/screens/(modal)/EditEmailScreen"
import { accentColor } from "@/src/theme/colors"

import { setAvatar } from "../utils"

export const EditProfileScreen = () => {
  const whoami = useWhoami()

  const { t } = useTranslation("settings")
  const [dirtyFields, setDirtyFields] = useState<Partial<UserProfileEditable>>({})

  const { mutateAsync: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      await userSyncService.updateProfile(dirtyFields)
    },
    onSuccess: () => {
      toast.success("Profile updated")
      setDirtyFields({})
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (!whoami) {
    return (
      <View className="flex-1 items-center justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <SafeNavigationScrollView
        keyboardShouldPersistTaps="handled"
        Header={
          <NavigationBlurEffectHeaderView
            headerRight={
              <HeaderSubmitTextButton
                label={t("words.save", { ns: "common" })}
                isValid={Object.keys(dirtyFields).length > 0}
                isLoading={isPending}
                onPress={() => {
                  updateProfile()
                }}
              />
            }
            title={t("profile.edit_profile")}
          />
        }
        className="bg-system-grouped-background"
      >
        <AvatarSection whoami={whoami} />
        <ProfileForm whoami={whoami} dirtyFields={dirtyFields} setDirtyFields={setDirtyFields} />
      </SafeNavigationScrollView>
    </KeyboardAvoidingView>
  )
}

const AvatarSection: FC<{
  whoami: MeModel
}> = ({ whoami }) => {
  const { t } = useTranslation("settings")
  return (
    <View className="mt-6 items-center justify-center">
      <UserAvatar
        image={whoami?.image}
        name={whoami?.name}
        size={80}
        className={!whoami?.name || !whoami.image ? "bg-system-background" : ""}
      />

      <TouchableOpacity className="mt-2" hitSlop={10} onPress={setAvatar}>
        <Text className="text-accent text-lg">{t("profile.set_avatar")}</Text>
      </TouchableOpacity>
    </View>
  )
}

const ProfileForm: FC<{
  whoami: MeModel
  dirtyFields: Partial<UserProfileEditable>
  setDirtyFields: (dirtyFields: Partial<UserProfileEditable>) => void
}> = ({ whoami, dirtyFields, setDirtyFields }) => {
  const { t } = useTranslation("settings")

  const navigation = useNavigation()

  const socialLinkFields: (keyof NonNullable<MeModel["socialLinks"]>)[] = [
    "twitter",
    "github",
    "instagram",
    "facebook",
    "youtube",
    "discord",
  ]

  const socialCopyMap = {
    twitter: t("profile.social.twitter", "Twitter"),
    github: t("profile.social.github", "GitHub"),
    instagram: t("profile.social.instagram", "Instagram"),
    facebook: t("profile.social.facebook", "Facebook"),
    youtube: t("profile.social.youtube", "YouTube"),
    discord: t("profile.social.discord", "Discord"),
  }

  return (
    <View className="mt-4">
      <TouchableWithoutFeedback
        onPress={() => {
          KeyboardController.dismiss()
        }}
      >
        <View className="w-full">
          <GroupedInsetListCard>
            <GroupedInsetListCell
              label={t("profile.name.label")}
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
          <GroupedOutlineDescription description={t("profile.name.description")} />

          {/* User name */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListCell
              label={t("profile.handle.label")}
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
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
          {/* Email */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListNavigationLink
              label={t("profile.email.label")}
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
          <GroupedOutlineDescription description={t("profile.handle.description")} />

          <GroupedInsetListSectionHeader label={t("profile.bio.label", "Bio")} />
          <GroupedInsetListCard>
            <View className="flex-1">
              <TextInput
                clearButtonMode="always"
                className="text-label h-[100px] w-full flex-1 px-4 py-3"
                value={dirtyFields.bio ?? whoami?.bio ?? ""}
                hitSlop={10}
                multiline
                selectionColor={accentColor}
                onChangeText={(text) => {
                  setDirtyFields({ ...dirtyFields, bio: text })
                }}
                textAlignVertical="top"
                placeholder={t("profile.bio.placeholder", "Tell us about yourself")}
              />
            </View>
          </GroupedInsetListCard>

          {/* Website */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListCell
              label={t("profile.website.label", "Website")}
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
              <View className="flex-1">
                <PlainTextField
                  className="text-secondary-label w-full flex-1 text-right"
                  value={dirtyFields.website ?? whoami?.website ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({ ...dirtyFields, website: text })
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://example.com"
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>

          {/* Social Links */}
          <GroupedInsetListSectionHeader
            label={t("profile.social.title", "Social Media Handles")}
          />
          <GroupedInsetListCard>
            {socialLinkFields.map((social) => (
              <GroupedInsetListCell
                key={social}
                label={socialCopyMap[social]}
                leftClassName="flex-none"
                rightClassName="flex-1"
              >
                <View className="flex-1">
                  <PlainTextField
                    className="text-secondary-label w-full flex-1 text-right"
                    value={dirtyFields.socialLinks?.[social] ?? whoami?.socialLinks?.[social] ?? ""}
                    hitSlop={10}
                    selectionColor={accentColor}
                    onChangeText={(text) => {
                      setDirtyFields({
                        ...dirtyFields,
                        socialLinks: {
                          ...whoami?.socialLinks,
                          ...dirtyFields.socialLinks,
                          [social]: text,
                        },
                      })
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </GroupedInsetListCell>
            ))}
          </GroupedInsetListCard>
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}
