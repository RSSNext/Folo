import "./global.css"

import { registerRootComponent } from "expo"
import { Image } from "expo-image"
import { cssInterop } from "nativewind"
import { useTranslation } from "react-i18next"
import { enableFreeze } from "react-native-screens"

import { App } from "./App"
import { BottomTabProvider } from "./components/layouts/tabbar/BottomTabProvider"
import { BottomTabs } from "./components/layouts/tabbar/BottomTabs"
import { initializeApp } from "./initialize"
import { initializeI18n } from "./lib/i18n"
import { TabBarPortal } from "./lib/navigation/bottom-tab/TabBarPortal"
import { TabRoot } from "./lib/navigation/bottom-tab/TabRoot"
import { TabScreen } from "./lib/navigation/bottom-tab/TabScreen"
import { RootStackNavigation } from "./lib/navigation/StackNavigation"
import { RootProviders } from "./providers"
import { IndexTabScreen } from "./screens/(stack)/(tabs)"
import { DiscoverTabScreen } from "./screens/(stack)/(tabs)/discover"
import { SettingsTabScreen } from "./screens/(stack)/(tabs)/settings"
import { SubscriptionsTabScreen } from "./screens/(stack)/(tabs)/subscriptions"
import { registerSitemap } from "./sitemap"

enableFreeze(true)
cssInterop(Image, { className: "style" })

initializeApp()

registerSitemap()
initializeI18n().then(() => {
  registerRootComponent(RootComponent)
})

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
              <TabScreen title={t("tabs.home")}>
                <IndexTabScreen />
              </TabScreen>

              <TabScreen title={t("tabs.subscriptions")}>
                <SubscriptionsTabScreen />
              </TabScreen>

              <TabScreen title={t("tabs.discover")}>
                <DiscoverTabScreen />
              </TabScreen>
              <TabScreen title={t("tabs.settings")}>
                <SettingsTabScreen />
              </TabScreen>

              <TabBarPortal>
                <BottomTabs />
              </TabBarPortal>
            </TabRoot>
          </App>
        </RootStackNavigation>
      </BottomTabProvider>
    </RootProviders>
  )
}
