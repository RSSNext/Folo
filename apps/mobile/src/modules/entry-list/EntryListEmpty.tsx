import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { Text } from "@/src/components/ui/typography/Text"
import { CelebrateCuteReIcon } from "@/src/icons/celebrate_cute_re"
import { getFetchErrorMessage } from "@/src/lib/error-parser"
import { useColor } from "@/src/theme/colors"

export const EntryListEmpty = ({
  error,
  onRetry,
}: {
  /** Loading the timeline failed, so it is not known to be empty */
  error?: Error | null
  onRetry?: () => void
}) => {
  const { t } = useTranslation()
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const color = useColor("secondaryLabel")
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-center text-secondary-label">{getFetchErrorMessage(error)}</Text>
        {!!onRetry && (
          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-secondary-system-fill px-4 py-2"
            onPress={onRetry}
          >
            <Text className="font-medium text-accent">{t("retry", { ns: "common" })}</Text>
          </Pressable>
        )}
      </View>
    )
  }
  return (
    <View className="flex-1 items-center justify-center gap-2">
      {unreadOnly ? (
        <>
          <CelebrateCuteReIcon height={30} width={30} color={color} />
          <Text className="text-lg font-medium text-secondary-label">
            {t("entry_list.zero_unread")}
          </Text>
        </>
      ) : (
        <Text className="text-secondary-label">{t("entry_list.empty")}</Text>
      )}
    </View>
  )
}
