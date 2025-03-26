import "./global.css"

import { registerRootComponent } from "expo"
import { Image } from "expo-image"
import { cssInterop } from "nativewind"
import { enableFreeze } from "react-native-screens"

import { Analytics } from "./Analytics"
import { App } from "./App"
import { BottomTabProvider } from "./components/layouts/tabbar/BottomTabProvider"
import { BottomTabs } from "./components/layouts/tabbar/BottomTabs"
import { initializeApp } from "./initialize"
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
registerRootComponent(() => (
  <RootProviders>
    <BottomTabProvider>
      <RootStackNavigation
        headerConfig={{
          hidden: true,
        }}
      >
        <App>
          <TabRoot>
            <TabScreen title="Home">
              <IndexTabScreen />
            </TabScreen>

            <TabScreen title="Subscriptions">
              <SubscriptionsTabScreen />
            </TabScreen>

            <TabScreen title="Discover">
              <DiscoverTabScreen />
            </TabScreen>
            <TabScreen title="Settings">
              <SettingsTabScreen />
            </TabScreen>

            <TabBarPortal>
              <BottomTabs />
            </TabBarPortal>
          </TabRoot>
        </App>
        <Analytics />
      </RootStackNavigation>
    </BottomTabProvider>
  </RootProviders>
))
