import * as React from "react"
import { TouchableOpacity, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { useCanBack, useNavigation } from "@/src/lib/navigation/hooks"

interface ScreenErrorScreenProps {
  error?: Error
  resetError?: () => void
}
export const ScreenErrorScreen: React.FC<ScreenErrorScreenProps> = ({ error }) => {
  const navigation = useNavigation()
  const canGoBack = useCanBack()
  return (
    <View className="flex-1 bg-system-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-6 text-[64px]">😕</Text>
        <Text className="mb-3 text-center text-xl font-semibold text-label">
          This page went wrong, go back and try again.
        </Text>
        <Text className="mb-8 text-center text-lg text-secondary-label">
          {error?.message || "An unexpected error occurred."}
        </Text>

        <View className="flex-row gap-4">
          {canGoBack && (
            <TouchableOpacity
              className="min-w-[160px] rounded-xl bg-accent px-6 py-3"
              onPress={() => navigation.back()}
            >
              <Text className="text-center text-[17px] font-semibold text-white">Go Back </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}
