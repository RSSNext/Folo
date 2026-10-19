import { isMobile } from "@follow/components/hooks/useMobile.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { tracker } from "@follow/tracker"
import { nextFrame } from "@follow/utils"
import { readAuthRedirectError, withoutAuthRedirectError } from "@follow/utils/auth-error"
import { cn, getOS } from "@follow/utils/utils"
import { useEffect, useLayoutEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate } from "react-router"
import { toast } from "sonner"

import { useAppIsReady } from "./atoms/app"
import { useUISettingKey } from "./atoms/settings/ui"
import { removeAppSkeleton } from "./lib/app"
import { takeAuthRedirectError } from "./lib/auth-redirect-error"
import { ipcServices } from "./lib/client"
import { appLog } from "./lib/log"
import { Titlebar } from "./modules/app/Titlebar"
import { RootProviders } from "./providers/root-providers"

function App() {
  const windowsElectron = IN_ELECTRON && getOS() === "Windows"
  return (
    <RootProviders>
      {IN_ELECTRON && (
        <div
          className={cn(
            "drag-region fixed inset-x-0 top-0 h-12 shrink-0",
            windowsElectron && "pointer-events-none z-[9999]",
          )}
          aria-hidden
        >
          {windowsElectron && <Titlebar />}
        </div>
      )}

      <AppLayer />
    </RootProviders>
  )
}

const AppLayer = () => {
  const appIsReady = useAppIsReady()

  const onceReady = useRef(false)
  useLayoutEffect(() => {
    if (appIsReady && !onceReady.current) {
      onceReady.current = true
      ipcServices?.app.readyToShowMainWindow()
      nextFrame(removeAppSkeleton)
    }
  }, [appIsReady])

  useEffect(() => {
    // Measured once, when the app first renders its content instead of the skeleton
    if (!appIsReady) return
    const doneTime = Math.trunc(performance.now())
    tracker.uiRenderInit(doneTime)
    appLog("App is ready", `${doneTime}ms`)
  }, [appIsReady])

  useAuthRedirectErrorNotice(appIsReady)

  useEffect(() => {
    if (!isMobile()) return
    const handler = (e: MouseEvent) => {
      e.preventDefault()
    }
    document.addEventListener("contextmenu", handler)

    return () => {
      document.removeEventListener("contextmenu", handler)
    }
  }, [])

  return appIsReady ? <Outlet /> : <AppSkeleton />
}

/** Says why a sign-in that left the app failed, once the app shows, and drops it from the URL */
const useAuthRedirectErrorNotice = (appIsReady: boolean) => {
  const { t } = useTranslation("common")
  // Not useLocation, which would render the whole app again on every navigation
  const navigate = useNavigate()

  useEffect(() => {
    if (!appIsReady) return
    const error = takeAuthRedirectError()
    if (!error) return

    // The first route usually dropped the query already
    const { pathname, search, hash } = window.location
    if (readAuthRedirectError(search)) {
      navigate({ pathname, search: withoutAuthRedirectError(search), hash }, { replace: true })
    }
    toast.error(t(error.messageKey), error.explained ? undefined : { description: error.code })
  }, [appIsReady, navigate, t])
}

const AppSkeleton = () => {
  const feedColWidth = useUISettingKey("feedColWidth")
  return (
    <div className="flex size-full">
      <div
        className="h-full shrink-0 bg-sidebar"
        style={{
          width: `${feedColWidth}px`,
        }}
      />
    </div>
  )
}

export { App as Component }
