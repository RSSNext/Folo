import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { sqlite } from "@follow/database/db"
import { jotaiStore } from "@follow/utils"
import { PortalProvider } from "@gorhom/portal"
import { QueryClientProvider } from "@tanstack/react-query"
import { useDrizzleStudio } from "expo-drizzle-studio-plugin"
import { ComposeContextProvider } from "foxact/compose-context-provider"
import { Provider } from "jotai"
import type { ReactNode } from "react"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { SheetProvider } from "react-native-sheet-transitions"
import { useCurrentColorsVariants } from "react-native-uikit-colors"

import { ErrorBoundary } from "../components/common/ErrorBoundary"
import { GlobalErrorScreen } from "../components/errors/GlobalErrorScreen"
import { LightboxStateProvider } from "../components/ui/lightbox/lightboxState"
import { queryClient } from "../lib/query-client"
import { TimelineSelectorDragProgressProvider } from "../modules/screen/atoms"
import { FontScalingProvider } from "./FontScalingProvider"
import { MigrationProvider } from "./migration"
import { ServerConfigsLoader } from "./ServerConfigsLoader"

/* eslint-disable @eslint-react/no-missing-key */
const contexts = [
  <MigrationProvider children={null} />,
  <Provider store={jotaiStore} />,
  <ErrorBoundary fallbackRender={GlobalErrorScreen} children={null} />,
  <KeyboardProvider children={null} />,
  <QueryClientProvider client={queryClient} />,
  <GestureHandlerRootView />,
  <SheetProvider children={null} />,
  <ActionSheetProvider children={null} />,
  <LightboxStateProvider children={null} />,
  <TimelineSelectorDragProgressProvider children={null} />,
  <PortalProvider children={null} />,
  <SafeAreaProvider />,
  <FontScalingProvider />,
]

export const RootProviders = ({ children }: { children: ReactNode }) => {
  useDrizzleStudio(sqlite as any)

  const currentThemeColors = useCurrentColorsVariants()

  return (
    <View style={[flexStyle, currentThemeColors]}>
      {/* Learn more https://foxact.skk.moe/compose-context-provider/ */}
      <ComposeContextProvider contexts={contexts}>
        {children}
        <ServerConfigsLoader />
      </ComposeContextProvider>
    </View>
  )
}

const flexStyle = { flex: 1 }
