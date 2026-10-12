import { useWhoami } from "@follow/store/user/hooks"
import type { MeModel } from "@follow/store/user/store"
import { userSyncService, UserUpdateError } from "@follow/store/user/store"
import type { UserProfileEditable } from "@follow/store/user/types"
import { useMutation } from "@tanstack/react-query"
import type { FC } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  KeyboardAvoidingView,
  Pressable,
  TextInput,
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
import { Text } from "@/src/components/ui/typography/Text"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { followApi } from "@/src/lib/api-client"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { EditEmailScreen } from "@/src/screens/(modal)/EditEmailScreen"
import { accentColor } from "@/src/theme/colors"

import type { ProfileTextField } from "../profile-validation"
import { getProfileFieldError, getServerProfileFieldError } from "../profile-validation"
import { setAvatar } from "../utils"

// The text fields this screen edits, which show the errors of their values
const FORM_FIELDS = ["name", "handle", "bio", "website"] as const satisfies ProfileTextField[]
type FormField = (typeof FORM_FIELDS)[number]
type FieldErrors = Partial<Record<FormField, string>>

const isFormField = (field: ProfileTextField): field is FormField =>
  (FORM_FIELDS as readonly ProfileTextField[]).includes(field)

/** A save the server refused for one field, shown under that field */
class ProfileFieldError extends Error {
  readonly field: ProfileTextField

  constructor(field: ProfileTextField, message: string) {
    super(message)
    this.field = field
  }
}

const isHandleTakenByOthers = async (handle: string, userId: string) => {
  try {
    const res = await followApi.profiles.getProfile({ handle })
    return !!res.data && res.data.id !== userId
  } catch {
    // Unknown handles answer with an error, so the handle is free or the lookup failed
    return false
  }
}

export const EditProfileScreen = () => {
  const whoami = useWhoami()
  const { t } = useTranslation("settings")
  const [dirtyFields, setDirtyFields] = useState<Partial<UserProfileEditable>>({})
  const [serverFieldError, setServerFieldError] = useState<{
    field: FormField
    message: string
  } | null>(null)

  // Only the changed fields are saved, so a stored value the checks would refuse stays editable
  const fieldErrors: FieldErrors = {}
  for (const field of FORM_FIELDS) {
    const value = dirtyFields[field]
    const error =
      value === undefined ? undefined : getProfileFieldError(field, value, whoami?.handle)
    if (error) fieldErrors[field] = error
  }
  const hasFieldError = Object.keys(fieldErrors).length > 0
  if (serverFieldError && !fieldErrors[serverFieldError.field]) {
    fieldErrors[serverFieldError.field] = serverFieldError.message
  }

  const updateDirtyFields = (fields: Partial<UserProfileEditable>) => {
    setDirtyFields(fields)
    // The server's error stays on its field until the field changes
    if (
      serverFieldError &&
      fields[serverFieldError.field] !== dirtyFields[serverFieldError.field]
    ) {
      setServerFieldError(null)
    }
  }

  const { mutateAsync: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      try {
        await userSyncService.updateProfile(dirtyFields)
      } catch (error) {
        const fieldError = getServerProfileFieldError(
          error instanceof UserUpdateError ? error.code : undefined,
        )
        if (fieldError) {
          throw new ProfileFieldError(fieldError.field, fieldError.message)
        }
        // Servers without HANDLE_ALREADY_TAKEN answer a handle another user has with a bare 500,
        // so look it up
        const handle = dirtyFields.handle?.trim()
        if (
          whoami &&
          handle &&
          handle.toLowerCase() !== whoami.handle?.trim().toLowerCase() &&
          (await isHandleTakenByOthers(handle, whoami.id))
        ) {
          throw new ProfileFieldError("handle", t("profile.handle.taken"))
        }
        throw error
      }
    },
    onSuccess: () => {
      toast.success(t("profile.updateSuccess"))
      setDirtyFields({})
      setServerFieldError(null)
    },
    onError: (error) => {
      if (error instanceof ProfileFieldError && isFormField(error.field)) {
        setServerFieldError({ field: error.field, message: error.message })
        return
      }
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
                label={t("words.save", {
                  ns: "common",
                })}
                isValid={Object.keys(dirtyFields).length > 0 && !hasFieldError}
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
        <ProfileForm
          whoami={whoami}
          dirtyFields={dirtyFields}
          setDirtyFields={updateDirtyFields}
          errors={fieldErrors}
        />
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
      <UserAvatar image={whoami?.image} name={whoami?.name} size={80} />

      <Pressable className="mt-2" hitSlop={10} onPress={setAvatar}>
        <Text className="text-lg text-accent">{t("profile.set_avatar")}</Text>
      </Pressable>
    </View>
  )
}
const FieldErrorText: FC<{ message: string | undefined }> = ({ message }) =>
  message ? <Text className="mx-9 mt-2 text-xs text-red">{message}</Text> : null

const ProfileForm: FC<{
  whoami: MeModel
  dirtyFields: Partial<UserProfileEditable>
  setDirtyFields: (dirtyFields: Partial<UserProfileEditable>) => void
  errors: FieldErrors
}> = ({ whoami, dirtyFields, setDirtyFields, errors }) => {
  const { t } = useTranslation("settings")
  const navigation = useNavigation()
  type SocialLinkKey = "twitter" | "github" | "instagram" | "facebook" | "youtube" | "discord"
  const socialLinkFields: SocialLinkKey[] = [
    "twitter",
    "github",
    "instagram",
    "facebook",
    "youtube",
    "discord",
  ]
  const socialCopyMap: Record<SocialLinkKey, string> = {
    twitter: "Twitter",
    github: "GitHub",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    discord: "Discord",
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
                  className="w-full flex-1 text-right text-secondary-label"
                  value={dirtyFields.name ?? whoami?.name ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({
                      ...dirtyFields,
                      name: text,
                    })
                  }}
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>
          <FieldErrorText message={errors.name} />
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
                  className="w-full flex-1 text-right text-secondary-label"
                  value={dirtyFields.handle ?? whoami?.handle ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({
                      ...dirtyFields,
                      handle: text,
                    })
                  }}
                  // A handle is an identifier, not a sentence the keyboard should capitalize or correct
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>
          <FieldErrorText message={errors.handle} />
          <GroupedOutlineDescription description={t("profile.handle.description")} />

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
                <View className="ml-auto shrink flex-row items-center gap-2">
                  <Text
                    className="shrink text-secondary-label"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {whoami.email}
                  </Text>
                  {whoami.emailVerified ? (
                    <CheckCircleCuteReIcon height={18} width={18} color={"#00C75F"} />
                  ) : (
                    <CloseCircleFillIcon height={18} width={18} color={"#FF3B30"} />
                  )}
                </View>
              }
            />
          </GroupedInsetListCard>

          <GroupedInsetListSectionHeader label={t("profile.profile.bio")} />
          <GroupedInsetListCard>
            <View className="flex-1">
              <TextInput
                clearButtonMode="always"
                className="h-[100px] w-full flex-1 px-4 py-3 text-label"
                value={dirtyFields.bio ?? whoami?.bio ?? ""}
                hitSlop={10}
                multiline
                selectionColor={accentColor}
                onChangeText={(text) => {
                  setDirtyFields({
                    ...dirtyFields,
                    bio: text,
                  })
                }}
                textAlignVertical="top"
                placeholder={t("profile.profile.bio_placeholder")}
              />
            </View>
          </GroupedInsetListCard>
          <FieldErrorText message={errors.bio} />

          {/* Website */}
          <GroupedInsetListCard className="mt-4">
            <GroupedInsetListCell
              label={t("profile.profile.website")}
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
              <View className="flex-1">
                <PlainTextField
                  className="w-full flex-1 text-right text-secondary-label"
                  value={dirtyFields.website ?? whoami?.website ?? ""}
                  hitSlop={10}
                  selectionColor={accentColor}
                  onChangeText={(text) => {
                    setDirtyFields({
                      ...dirtyFields,
                      website: text,
                    })
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://example.com"
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>
          <FieldErrorText message={errors.website} />

          {/* Social Links */}
          <GroupedInsetListSectionHeader label={t("profile.profile.social_links")} />
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
                    className="w-full flex-1 text-right text-secondary-label"
                    value={
                      dirtyFields.socialLinks?.[social] ??
                      (whoami?.socialLinks as Partial<Record<SocialLinkKey, string>> | undefined)?.[
                        social
                      ] ??
                      ""
                    }
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
