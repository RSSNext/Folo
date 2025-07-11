import { useEffect } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"

import { setUpdaterStatus } from "~/atoms/updater"

// check for updates every hour
const period = 60 * 60 * 1000

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r)
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r)
        })
      }
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setUpdaterStatus({
        type: "pwa",
        status: "ready",
        finishUpdate: () => {
          updateServiceWorker(true)
        },
      })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration) {
  if (period <= 0) return

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    })

    if (resp?.status === 200) await r.update()
  }, period)
}
