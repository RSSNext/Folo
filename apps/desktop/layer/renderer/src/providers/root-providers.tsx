import { MotionProvider } from "@follow/components/common/MotionProvider.jsx"
import { EventProvider } from "@follow/components/providers/event-provider.js"
import { StableRouterProvider } from "@follow/components/providers/stable-router-provider.js"
import { Toaster } from "@follow/components/ui/toast/index.jsx"
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Provider } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { Suspense } from "react"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import { HotkeysProvider } from "react-hotkeys-hook"

import { HotKeyScopeMap } from "~/constants/hotkeys"
import { jotaiStore } from "~/lib/jotai"
import { persistConfig, queryClient } from "~/lib/query-client"
import { FollowCommandManager } from "~/modules/command/command-manager"

import { I18nProvider } from "./i18n-provider"
import { InvalidateQueryProvider } from "./invalidate-query-provider"
import {
  LazyContextMenuProvider,
  LazyExtensionExposeProvider,
  LazyExternalJumpInProvider,
  LazyLottieRenderContainer,
  LazyModalStackProvider,
  LazyPWAPrompt,
  LazyReloadPrompt,
  // specific import should add `index` postfix
} from "./lazy/index"
import { ServerConfigsProvider } from "./server-configs-provider"
import { SettingSync } from "./setting-sync"
import { UserProvider } from "./user-provider"

export const RootProviders: FC<PropsWithChildren> = ({ children }) => (
  <GoogleReCaptchaProvider
    reCaptchaKey={env.VITE_RECAPTCHA_V3_SITE_KEY}
    useEnterprise={true}
    useRecaptchaNet={true}
  >
    <MotionProvider>
      <PersistQueryClientProvider persistOptions={persistConfig} client={queryClient}>
        <HotkeysProvider initiallyActiveScopes={HotKeyScopeMap.Home}>
          <Provider store={jotaiStore}>
            <I18nProvider>
              <Toaster />
              <EventProvider />

              <UserProvider />
              <ServerConfigsProvider />

              <StableRouterProvider />
              <SettingSync />
              <FollowCommandManager />
              {import.meta.env.DEV && <Devtools />}

              {children}

              <Suspense>
                <LazyExtensionExposeProvider />
                <LazyModalStackProvider />
                <LazyContextMenuProvider />
                <LazyLottieRenderContainer />
                <LazyExternalJumpInProvider />
                <LazyReloadPrompt />
                {!window.__RN__ && <LazyPWAPrompt />}
              </Suspense>
            </I18nProvider>
          </Provider>
        </HotkeysProvider>

        <InvalidateQueryProvider />
      </PersistQueryClientProvider>
    </MotionProvider>
  </GoogleReCaptchaProvider>
)

const Devtools = () =>
  !IN_ELECTRON && (
    <div className="hidden lg:block print:hidden">
      <ReactQueryDevtools buttonPosition="bottom-left" client={queryClient} />
    </div>
  )
