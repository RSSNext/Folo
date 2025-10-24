import { applicationName } from "expo-application"
import * as React from "react"
import { TouchableOpacity, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

interface GlobalErrorScreenProps {
  error?: Error
  resetError?: () => void
}
export const GlobalErrorScreen: React.FC<GlobalErrorScreenProps> = ({ error, resetError }) => {
  return (
    <View className="flex-1 bg-system-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-6 text-[64px]">😕</Text>
        <Text className="mb-3 text-center text-xl font-semibold text-label">
          {applicationName} crashed!
        </Text>
        <Text className="mb-8 text-center text-lg text-secondary-label">
          {error?.message || "An unexpected error occurred."}
        </Text>
        {resetError && (
          <TouchableOpacity
            className="min-w-[160px] rounded-xl bg-accent px-6 py-3"
            onPress={resetError}
          >
            <Text className="text-center text-[17px] font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
