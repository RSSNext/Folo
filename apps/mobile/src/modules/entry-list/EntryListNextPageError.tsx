import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { getFetchErrorMessage } from "@/src/lib/error-parser"

/** Tells a failed next page apart from one that is still loading, and offers to try again */
export const EntryListNextPageError = ({
  error,
  onRetry,
}: {
  error: Error | null
  onRetry: () => void
}) => {
  const { t } = useTranslation()
  return (
    <View className="items-center justify-center gap-2 px-6 py-6">
      <Text className="text-center text-secondary-label">
        {(error && getFetchErrorMessage(error)) || t("entry_list.load_more_failed")}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="rounded-full bg-secondary-system-fill px-4 py-2"
        onPress={onRetry}
      >
        <Text className="font-medium text-accent">{t("retry", { ns: "common" })}</Text>
      </Pressable>
    </View>
  )
}
