import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { GroupedInsetListNavigationLinkIcon } from "@/src/components/ui/grouped/GroupedList"
import { Text } from "@/src/components/ui/typography/Text"
import { DocmentCuteReIcon } from "@/src/icons/docment_cute_re"
import { FileImportCuteReIcon } from "@/src/icons/file_import_cute_re"
import { ListCheck2CuteReIcon } from "@/src/icons/list_check_2_cute_re"
import { MingcuteRightLine } from "@/src/icons/mingcute_right_line"
import { Settings1CuteReIcon } from "@/src/icons/settings_1_cute_re"
import { Translate2CuteReIcon } from "@/src/icons/translate_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { SelectReadingModeScreen } from "@/src/screens/(modal)/onboarding/SelectReadingModeScreen"
import { accentColor } from "@/src/theme/colors"

import { EditProfileScreen } from "../settings/routes/EditProfile"
import { LanguageSelect } from "../settings/routes/General"
import { importOpml } from "../settings/utils"
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
        <Text className="mt-2 text-center text-xl font-bold text-text">
          {t("onboarding.preferences_title")}
        </Text>
        <Text className="text-center text-base text-label">
          {t("onboarding.preferences_description")}
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
            <Text className="text-base font-medium text-text">
              {t("general.language.title", {
                ns: "settings",
              })}
            </Text>
            <View className="w-[150px]">
              <LanguageSelect settingKey="language" />
            </View>
          </View>
          <Text className="text-sm text-secondary-label">
            {t("onboarding.language_description")}
          </Text>
        </PreferenceCard>

        {/* Import Card */}
        <PreferenceCard
          title={t("onboarding.import_content")}
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#CBAD6D">
              <FileImportCuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          onPress={importOpml}
        >
          <View className="flex-row">
            <Text className="flex-1 text-secondary-label">
              {t("onboarding.import_description")}
            </Text>
          </View>
        </PreferenceCard>

        <PreferenceCard
          title={t("onboarding.edit_profile")}
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#34D399">
              <Settings1CuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          onPress={() => {
            navigation.pushControllerView(EditProfileScreen)
          }}
        >
          <Text className="text-sm text-secondary-label">
            {t("onboarding.edit_profile_description")}
          </Text>
        </PreferenceCard>

        {/* Reading Preferences Card */}
        <PreferenceCard
          title={t("onboarding.reading_preferences")}
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
            <Text className="text-sm text-secondary-label">
              {t("onboarding.reading_radical_description")}
            </Text>
          )}
          {behavior === "balanced" && (
            <Text className="text-sm text-secondary-label">
              {t("onboarding.reading_balanced_description")}
            </Text>
          )}
          {behavior === "conservative" && (
            <Text className="text-sm text-secondary-label">
              {t("onboarding.reading_conservative_description")}
            </Text>
          )}
        </PreferenceCard>
      </View>
    </OnboardingSectionScreenContainer>
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
      className="flex flex-row items-center gap-2 rounded-xl bg-secondary-system-grouped-background p-4"
      onPress={onPress}
    >
      {icon}
      <View className="flex flex-1 flex-col gap-2">
        {title && <Text className="text-base font-medium text-text">{title}</Text>}
        {children}
      </View>
      {showRightArrow && <MingcuteRightLine height={18} width={18} color={rightIconColor} />}
    </Pressable>
  )
}
