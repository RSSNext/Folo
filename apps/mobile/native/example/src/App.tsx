import { View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useCurrentColorsVariants } from "react-native-uikit-colors"

import { Pager } from "./demo/Pager"

export default function App() {
  const currentThemeColors = useCurrentColorsVariants()

  return (
    <SafeAreaProvider>
      <View style={currentThemeColors} className="flex-1">
        <Pager />
      </View>
    </SafeAreaProvider>
  )
}
