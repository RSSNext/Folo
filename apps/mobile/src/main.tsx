import "./global.css"

import {
  apiClientSimpleContext,
  authClientSimpleContext,
  queryClientSimpleContext,
} from "@follow/store/context"
import { registerRootComponent } from "expo"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { cssInterop } from "nativewind"
import { useTranslation } from "react-i18next"
import { enableFreeze } from "react-native-screens"

import { App } from "./App"
import { BottomTabProvider } from "./components/layouts/tabbar/BottomTabProvider"
import { BottomTabs } from "./components/layouts/tabbar/BottomTabs"
import { Lightbox } from "./components/lightbox/Lightbox"
import { initializeApp } from "./initialize"
import { apiClient } from "./lib/api-fetch"
import { authClient } from "./lib/auth"
import { initializeI18n } from "./lib/i18n"
import { TabBarPortal } from "./lib/navigation/bottom-tab/TabBarPortal"
import { TabRoot } from "./lib/navigation/bottom-tab/TabRoot"
import { TabScreen } from "./lib/navigation/bottom-tab/TabScreen"
import { RootStackNavigation } from "./lib/navigation/StackNavigation"
import { queryClient } from "./lib/query-client"
import { RootProviders } from "./providers"
import { IndexTabScreen } from "./screens/(stack)/(tabs)"
import { DiscoverTabScreen } from "./screens/(stack)/(tabs)/discover"
import { SettingsTabScreen } from "./screens/(stack)/(tabs)/settings"
import { SubscriptionsTabScreen } from "./screens/(stack)/(tabs)/subscriptions"
import { registerSitemap } from "./sitemap"

// @ts-expect-error
global.APP_NAME = "Folo"
// @ts-expect-error
global.ELECTRON = false
apiClientSimpleContext.provide(apiClient)
authClientSimpleContext.provide(authClient)
queryClientSimpleContext.provide(queryClient)

enableFreeze(true)
;[Image, LinearGradient].forEach((Component) => {
  cssInterop(Component, { className: "style" })
})

initializeApp()
registerSitemap()
initializeI18n()
registerRootComponent(RootComponent)

function RootComponent() {
  const { t } = useTranslation()
  return (
    <RootProviders>
      <BottomTabProvider>
        <RootStackNavigation
          headerConfig={{
            hidden: true,
          }}
        >
          <App>
            <TabRoot>
              <TabScreen title={t("tabs.home")} identifier="IndexTabScreen">
                <IndexTabScreen />
              </TabScreen>

              <TabScreen title={t("tabs.subscriptions")} identifier="SubscriptionsTabScreen">
                <SubscriptionsTabScreen />
              </TabScreen>

              <TabScreen title={t("tabs.discover")} identifier="DiscoverTabScreen">
                <DiscoverTabScreen />
              </TabScreen>
              <TabScreen title={t("tabs.settings")} identifier="SettingsTabScreen">
                <SettingsTabScreen />
              </TabScreen>

              <TabBarPortal>
                <BottomTabs />
              </TabBarPortal>
            </TabRoot>
          </App>
        </RootStackNavigation>
        <Lightbox />
      </BottomTabProvider>
    </RootProviders>
  )
}
