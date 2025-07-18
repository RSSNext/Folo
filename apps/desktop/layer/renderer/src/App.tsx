import { isMobile } from "@follow/components/hooks/useMobile.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { tracker } from "@follow/tracker"
import { cn, getOS } from "@follow/utils/utils"
import { useEffect } from "react"
import { Outlet } from "react-router"

import { useAppIsReady } from "./atoms/app"
import { useUISettingKey } from "./atoms/settings/ui"
import { applyAfterReadyCallbacks } from "./initialize/queue"
import { removeAppSkeleton } from "./lib/app"
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

  useEffect(() => {
    removeAppSkeleton()

    const doneTime = Math.trunc(performance.now())
    tracker.uiRenderInit(doneTime)
    appLog("App is ready", `${doneTime}ms`)

    applyAfterReadyCallbacks()

    if (isMobile()) {
      const handler = (e: MouseEvent) => {
        e.preventDefault()
      }
      document.addEventListener("contextmenu", handler)

      return () => {
        document.removeEventListener("contextmenu", handler)
      }
    }
  }, [appIsReady])

  return appIsReady ? <Outlet /> : <AppSkeleton />
}

const AppSkeleton = () => {
  const feedColWidth = useUISettingKey("feedColWidth")
  return (
    <div className="flex size-full">
      <div
        className="bg-sidebar h-full shrink-0"
        style={{
          width: `${feedColWidth}px`,
        }}
      />
    </div>
  )
}

export { App as Component }
