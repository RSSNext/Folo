import { GlobalFocusableProvider } from "@follow/components/common/Focusable/GlobalFocusableProvider.js"
import { MotionProvider } from "@follow/components/common/MotionProvider.jsx"
import { EventProvider } from "@follow/components/providers/event-provider.js"
import { StableRouterProvider } from "@follow/components/providers/stable-router-provider.js"
import { Toaster } from "@follow/components/ui/toast/index.jsx"
import { IN_ELECTRON } from "@follow/shared/constants"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Provider } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { Suspense } from "react"

import { ModalStackProvider } from "~/components/ui/modal"
import { jotaiStore } from "~/lib/jotai"
import { persistConfig, queryClient } from "~/lib/query-client"
import { FollowCommandManager } from "~/modules/command/command-manager"

import { HotkeyProvider } from "./hotkey-provider"
import { I18nProvider } from "./i18n-provider"
import { InvalidateQueryProvider } from "./invalidate-query-provider"
import {
  LazyContextMenuProvider,
  LazyExtensionExposeProvider,
  LazyExternalJumpInProvider,
  LazyLottieRenderContainer,
  LazyPopoverProvider,
  LazyPWAPrompt,
  LazyReloadPrompt,
} from "./lazy/index"
import { ServerConfigsProvider } from "./server-configs-provider"
import { SettingSync } from "./setting-sync"
import { UserProvider } from "./user-provider"

export const RootProviders: FC<PropsWithChildren> = ({ children }) => (
  <Provider store={jotaiStore}>
    <MotionProvider>
      <PersistQueryClientProvider persistOptions={persistConfig} client={queryClient}>
        <GlobalFocusableProvider>
          <HotkeyProvider>
            <I18nProvider>
              <ModalStackProvider>
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
                  <LazyContextMenuProvider />
                  <LazyPopoverProvider />
                  <LazyLottieRenderContainer />
                  <LazyExternalJumpInProvider />
                  <LazyReloadPrompt />
                  {!IN_ELECTRON && <LazyPWAPrompt />}
                </Suspense>
                {/* <FocusableGuardProvider /> */}
              </ModalStackProvider>
            </I18nProvider>
          </HotkeyProvider>
        </GlobalFocusableProvider>

        <InvalidateQueryProvider />
      </PersistQueryClientProvider>
    </MotionProvider>
  </Provider>
)

const Devtools = () =>
  !IN_ELECTRON && (
    <div className="hidden lg:block print:hidden">
      <ReactQueryDevtools buttonPosition="bottom-left" client={queryClient} />
    </div>
  )
