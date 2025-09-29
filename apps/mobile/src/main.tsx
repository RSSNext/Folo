import "./global.css"
import "./polyfill"

import { apiContext, authClientContext, queryClientContext } from "@follow/store/context"
import * as Sentry from "@sentry/react-native"
import { registerRootComponent } from "expo"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { cssInterop } from "nativewind"
import { useTranslation } from "react-i18next"
import { enableFreeze } from "react-native-screens"

import { App } from "./App"
import { BottomTabProvider } from "./components/layouts/tabbar/BottomTabProvider"
import { ReactNativeTab } from "./components/layouts/tabbar/ReactNativeTab"
import { Lightbox } from "./components/ui/lightbox/Lightbox"
import { initializeApp } from "./initialize"
import { followApi } from "./lib/api-client"
import { authClient } from "./lib/auth"
import { initializeI18n } from "./lib/i18n"
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
// @ts-expect-error
authClientContext.provide(authClient)
queryClientContext.provide(queryClient)
apiContext.provide(followApi)

enableFreeze(true)
;[Image, LinearGradient].forEach((Component) => {
  cssInterop(Component, { className: "style" })
})

initializeApp()
registerSitemap()
initializeI18n()
registerRootComponent(Sentry.wrap(RootComponent))

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
              <TabScreen
                activeIcon={"home5CuteFi"}
                icon={"home5CuteRe"}
                title={t("tabs.home")}
                identifier="IndexTabScreen"
              >
                <IndexTabScreen />
              </TabScreen>

              <TabScreen
                activeIcon={"blackBoard2CuteFi"}
                icon={"blackBoard2CuteRe"}
                title={t("tabs.subscriptions")}
                identifier="SubscriptionsTabScreen"
              >
                <SubscriptionsTabScreen />
              </TabScreen>

              <TabScreen
                activeIcon={"search3CuteFi"}
                icon={"search3CuteRe"}
                title={t("tabs.discover")}
                identifier="DiscoverTabScreen"
              >
                <DiscoverTabScreen />
              </TabScreen>
              <TabScreen
                activeIcon={"settings1CuteFi"}
                icon={"settings1CuteRe"}
                title={t("tabs.settings")}
                identifier="SettingsTabScreen"
              >
                <SettingsTabScreen />
              </TabScreen>

              <ReactNativeTab />
            </TabRoot>
          </App>
        </RootStackNavigation>
        <Lightbox />
      </BottomTabProvider>
    </RootProviders>
  )
}
