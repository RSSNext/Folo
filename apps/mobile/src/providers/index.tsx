import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { sqlite } from "@follow/database/db"
import { jotaiStore } from "@follow/utils"
import { PortalProvider } from "@gorhom/portal"
import { QueryClientProvider } from "@tanstack/react-query"
import { useSQLiteDevTools } from "expo-sqlite-devtools"
import { Provider } from "jotai"
import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SheetProvider } from "react-native-sheet-transitions"
import { useCurrentColorsVariants } from "react-native-uikit-colors"

import { ErrorBoundary } from "../components/common/ErrorBoundary"
import { GlobalErrorScreen } from "../components/errors/GlobalErrorScreen"
import { queryClient } from "../lib/query-client"
import { MigrationProvider } from "./migration"
import { ServerConfigsProvider } from "./ServerConfigsProvider"

export const RootProviders = ({ children }: { children: ReactNode }) => {
  useSQLiteDevTools(sqlite)

  const currentThemeColors = useCurrentColorsVariants()

  return (
    <View style={[styles.flex, currentThemeColors]}>
      <MigrationProvider>
        <Provider store={jotaiStore}>
          <ErrorBoundary fallbackRender={GlobalErrorScreen}>
            <KeyboardProvider>
              <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView>
                  <SheetProvider>
                    <ActionSheetProvider>
                      <PortalProvider>{children}</PortalProvider>
                    </ActionSheetProvider>
                    <ServerConfigsProvider />
                  </SheetProvider>
                </GestureHandlerRootView>
              </QueryClientProvider>
            </KeyboardProvider>
          </ErrorBoundary>
        </Provider>
      </MigrationProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
