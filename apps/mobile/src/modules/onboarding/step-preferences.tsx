import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, Text, TouchableOpacity, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { GroupedInsetListNavigationLinkIcon } from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { DocmentCuteReIcon } from "@/src/icons/docment_cute_re"
import { FileImportCuteReIcon } from "@/src/icons/file_import_cute_re"
import { ListCheck2CuteReIcon } from "@/src/icons/list_check_2_cute_re"
import { MingcuteRightLine } from "@/src/icons/mingcute_right_line"
import { Settings1CuteReIcon } from "@/src/icons/settings_1_cute_re"
import { Translate2CuteReIcon } from "@/src/icons/translate_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { SelectReadingModeScreen } from "@/src/screens/(modal)/onboarding/select-reading-mode"
import { useWhoami } from "@/src/store/user/hooks"
import { accentColor } from "@/src/theme/colors"

import { EditProfileScreen } from "../settings/routes/EditProfile"
import { LanguageSelect } from "../settings/routes/General"
import { importOpml, setAvatar } from "../settings/utils"
import { useReadingBehavior } from "./hooks/use-reading-behavior"
import { OnboardingSectionScreenContainer } from "./shared"

export const StepPreferences = () => {
  const { t } = useTranslation()
  const { behavior } = useReadingBehavior()

  const navigation = useNavigation()
  return (
    <OnboardingSectionScreenContainer>
      <View className="mb-10 flex items-center gap-4">
        <ListCheck2CuteReIcon height={80} width={80} color={accentColor} />
        <Text className="text-text mt-2 text-center text-xl font-bold">
          Personalize Your Experience
        </Text>
        <Text className="text-label text-center text-base">
          Set your preferences to make Folo work best for you. You can always change these later in
          Settings.
        </Text>
      </View>

      <View className="mb-6 w-full flex-1 gap-4">
        <PreferenceCard
          showRightArrow={false}
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#FCA5A5">
              <Translate2CuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
        >
          <View className="flex flex-row items-center justify-between">
            <Text className="text-text text-base font-medium">
              {t("general.language", { ns: "settings" })}
            </Text>
            <View className="w-[150px]">
              <LanguageSelect settingKey="language" />
            </View>
          </View>
          <Text className="text-secondary-label text-sm">
            Choose the language you want to use in Folo
          </Text>
        </PreferenceCard>

        <PreferenceCard
          title="Edit Profile"
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#34D399">
              <Settings1CuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          onPress={() => {
            navigation.pushControllerView(EditProfileScreen)
          }}
        >
          <Text className="text-secondary-label text-sm">
            Change your name, email, and profile picture
          </Text>
        </PreferenceCard>

        {/* Reading Preferences Card */}
        <PreferenceCard
          title="Reading Preferences"
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#F59E0B">
              <DocmentCuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          onPress={() => {
            navigation.pushControllerView(SelectReadingModeScreen)
          }}
        >
          {behavior === "radical" && (
            <Text className="text-secondary-label text-sm">
              Automatically mark entries as read when displayed
            </Text>
          )}
          {behavior === "balanced" && (
            <Text className="text-secondary-label text-sm">
              Automatically mark entries as read when scrolled out of view
            </Text>
          )}
          {behavior === "conservative" && (
            <Text className="text-secondary-label text-sm">
              Mark entries as read only when clicked
            </Text>
          )}
        </PreferenceCard>

        {/* Import Card */}
        <PreferenceCard
          title="Import Your Content"
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#CBAD6D">
              <FileImportCuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          onPress={importOpml}
        >
          <View className="flex-row">
            <Text className="text-secondary-label flex-1">
              If you have used RSS before, you can import an OPML file
            </Text>
          </View>
        </PreferenceCard>
      </View>
    </OnboardingSectionScreenContainer>
  )
}

export const EditProfileSection = () => {
  const whoami = useWhoami()

  if (!whoami) {
    return (
      <View className="flex-1 items-center justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }

  return (
    <View className="flex-1 items-center justify-center">
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

type PreferenceCardProps = PropsWithChildren<{
  title?: string
  icon?: React.ReactNode
  showRightArrow?: boolean
  onPress?: () => void
}>

const PreferenceCard = ({
  title,
  children,
  onPress,
  icon,
  showRightArrow = true,
}: PreferenceCardProps) => {
  const rightIconColor = useColor("tertiaryLabel")

  return (
    <Pressable
      className="bg-secondary-system-grouped-background flex flex-row items-center gap-2 rounded-xl p-4"
      onPress={onPress}
    >
      {icon}
      <View className="flex flex-1 flex-col gap-2">
        {title && <Text className="text-text text-base font-medium">{title}</Text>}
        {children}
      </View>
      {showRightArrow && <MingcuteRightLine height={18} width={18} color={rightIconColor} />}
    </Pressable>
  )
}
