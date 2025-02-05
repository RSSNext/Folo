import { Stack } from "expo-router"
import { useColorScheme } from "react-native"

import { getSystemBackgroundColor } from "@/src/theme/utils"

export default function HeadlessLayout() {
  useColorScheme()
  const systemBackgroundColor = getSystemBackgroundColor()

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: systemBackgroundColor },
        headerShown: false,
      }}
    />
  )
}
