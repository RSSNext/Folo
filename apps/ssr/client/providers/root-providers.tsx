import { MotionProvider } from "@follow/components/common/MotionProvider.jsx"
import { EventProvider } from "@follow/components/providers/event-provider.jsx"
import { StableRouterProvider } from "@follow/components/providers/stable-router-provider.jsx"
import { Toaster } from "@follow/components/ui/toast/index.jsx"
import { useSyncThemeWebApp } from "@follow/hooks"
import { env } from "@follow/shared/env.ssr"
import { QueryClientProvider } from "@tanstack/react-query"
import { Provider } from "jotai"
import { ModalStackContainer } from "rc-modal-sheet/m"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

import { queryClient } from "../lib/query-client"
import { jotaiStore } from "../lib/store"
import { ServerConfigsProvider } from "./server-configs-provider"
import { UserProvider } from "./user-provider"

const ThemeProvider = () => {
  useSyncThemeWebApp()
  return null
}

export const RootProviders: FC<PropsWithChildren> = ({ children }) => (
  <MotionProvider>
    <Provider store={jotaiStore}>
      <RecaptchaProvider>
        <QueryClientProvider client={queryClient}>
          <ServerConfigsProvider />
          <ThemeProvider />
          <EventProvider />
          <StableRouterProvider />
          <ModalStackContainer>
            <UserProvider />
            <Toaster />
            {children}
          </ModalStackContainer>
        </QueryClientProvider>
      </RecaptchaProvider>
    </Provider>
  </MotionProvider>
)

const RecaptchaProvider: FC<PropsWithChildren> = ({ children }) => {
  const siteKey = env.VITE_RECAPTCHA_V3_SITE_KEY

  if (!siteKey) {
    return children
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true, appendTo: "body" }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
