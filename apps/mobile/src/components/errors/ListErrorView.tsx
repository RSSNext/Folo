import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { Text } from "@/src/components/ui/typography/Text"
import { AlertCuteFiIcon } from "@/src/icons/alert_cute_fi"

import { MonoText } from "../ui/typography/MonoText"

export const ListErrorView = ({ error, resetError }: { error: Error; resetError: () => void }) => {
  const { t } = useTranslation("common")
  const red = useColor("red")
  return (
    <View className="flex-1 items-center justify-center p-4">
      <View className="w-full max-w-[300px] items-center rounded-2xl bg-secondary-system-grouped-background p-6">
        <View className="mb-4 items-center justify-center rounded-3xl bg-quaternary-system-fill p-3">
          <AlertCuteFiIcon color={red} height={48} width={48} />
        </View>
        <Text className="mb-2 text-center text-lg font-semibold text-label">
          {t("error_screen.list_unable_to_load")}
        </Text>
        <Text className="mb-2 text-center text-base text-secondary-label">
          {t("error_screen.list_try_later")}
        </Text>
        <MonoText className="mb-4 text-center text-base text-secondary-label">
          {error.message || t("error_screen.unknown")}
        </MonoText>

        <TouchableOpacity className="w-full rounded-xl bg-accent px-6 py-3" onPress={resetError}>
          <Text className="text-center text-base font-semibold text-white">{t("retry")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
