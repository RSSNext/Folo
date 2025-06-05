import "./wdyr"
import "@follow/components/tailwind"
import "./styles/main.css"

import { IN_ELECTRON, WEB_BUILD } from "@follow/shared/constants"
import { apiClientSimpleContext, authClientSimpleContext } from "@follow/store/context"
import { getOS } from "@follow/utils/utils"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"

import { apiClient } from "~/lib/api-fetch"
import { authClient } from "~/lib/auth"

import { setAppIsReady } from "./atoms/app"
import { ElECTRON_CUSTOM_TITLEBAR_HEIGHT } from "./constants"
import { initializeApp } from "./initialize"
import { registerAppGlobalShortcuts } from "./initialize/global-shortcuts"
import { router } from "./router"

apiClientSimpleContext.provide(apiClient)
authClientSimpleContext.provide(authClient)

initializeApp().finally(() => {
  import("./push-notification").then(({ registerWebPushNotifications }) => {
    if (navigator.serviceWorker && WEB_BUILD) {
      registerWebPushNotifications()
    }
  })

  setAppIsReady(true)
})

const $container = document.querySelector("#root") as HTMLElement

if (IN_ELECTRON) {
  const os = getOS()

  switch (os) {
    case "Windows": {
      document.body.style.cssText += `--fo-window-padding-top: ${ElECTRON_CUSTOM_TITLEBAR_HEIGHT}px;`
      break
    }
    case "macOS": {
      document.body.style.cssText += `--fo-macos-traffic-light-width: 100px; --fo-macos-traffic-light-height: 30px;`
      break
    }
  }
  document.documentElement.dataset.os = getOS()
} else {
  registerAppGlobalShortcuts()
}

ReactDOM.createRoot($container).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
