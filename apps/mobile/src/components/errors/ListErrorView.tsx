import { TouchableOpacity, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { Text } from "@/src/components/ui/typography/Text"
import { AlertCuteFiIcon } from "@/src/icons/alert_cute_fi"

import { MonoText } from "../ui/typography/MonoText"

export const ListErrorView = ({ error, resetError }: { error: Error; resetError: () => void }) => {
  const red = useColor("red")
  return (
    <View className="flex-1 items-center justify-center p-4">
      <View className="bg-secondary-system-grouped-background w-full max-w-[300px] items-center rounded-2xl p-6">
        <View className="bg-quaternary-system-fill mb-4 items-center justify-center rounded-3xl p-3">
          <AlertCuteFiIcon color={red} height={48} width={48} />
        </View>
        <Text className="text-label mb-2 text-center text-lg font-semibold">
          Unable to Load Content
        </Text>
        <Text className="text-secondary-label mb-2 text-center text-base">
          There was a problem loading the list. Please try again later.
        </Text>
        <MonoText className="text-secondary-label mb-4 text-center text-base">
          {error.message || "Unknown Error"}
        </MonoText>

        <TouchableOpacity className="bg-accent w-full rounded-xl px-6 py-3" onPress={resetError}>
          <Text className="text-center text-base font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
