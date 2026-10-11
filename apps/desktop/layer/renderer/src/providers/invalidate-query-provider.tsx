import { usePageVisibility } from "@follow/hooks"
import { IN_ELECTRON } from "@follow/shared/constants"
import { isSyncEngineActive } from "@follow/store/sync/sync-status"
import type { Query } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

import { appLog } from "~/lib/log"

const staleTime = 600_000 // 10min

/**
 * Query roots the sync engine keeps fresh through the delta feed. While the engine is active
 * it pulls on every return to the app and refetches only the entry lists that actually
 * changed, so the blanket invalidation skips them.
 */
const SYNC_MANAGED_QUERY_ROOTS = new Set<unknown>(["entries", "subscription", "unread"])

const isManagedBySyncEngine = (query: Query) =>
  isSyncEngineActive() && SYNC_MANAGED_QUERY_ROOTS.has(query.queryKey[0])

export class ElectronCloseEvent extends Event {
  static type = "electron-close"
  constructor() {
    super("electron-close")
  }
}
export class ElectronShowEvent extends Event {
  static type = "electron-show"
  constructor() {
    super("electron-show")
  }
}

/**
 * Add a event listener to invalidate all queries
 */

const InvalidateQueryProviderElectron = () => {
  const queryClient = useQueryClient()

  const currentTimeRef = useRef(0)

  useEffect(() => {
    const handler = () => {
      currentTimeRef.current = Date.now()
      appLog("Window switch to close")
    }

    document.addEventListener(ElectronCloseEvent.type, handler)

    return () => {
      document.removeEventListener(ElectronCloseEvent.type, handler)
    }
  }, [queryClient])

  useEffect(() => {
    const handler = () => {
      const now = Date.now()
      if (!currentTimeRef.current || now - currentTimeRef.current < staleTime) {
        appLog(
          `Window switch to visible, but skip invalidation, ${currentTimeRef.current ? now - currentTimeRef.current : 0}`,
        )
      } else {
        appLog("Window switch to visible, invalidate all queries except entries")
        queryClient.invalidateQueries({
          predicate(query) {
            // Ignore entries queries
            return query.queryKey[0] !== "entries" && !isManagedBySyncEngine(query)
          },
        })
      }
      currentTimeRef.current = 0
    }

    document.addEventListener(ElectronShowEvent.type, handler)

    return () => {
      document.removeEventListener(ElectronShowEvent.type, handler)
    }
  }, [queryClient])
  return null
}

/**
 * Invalidate all queries when the window is visible again after being hidden for a while
 */

const InvalidateQueryProviderWebApp = () => {
  const queryClient = useQueryClient()

  const hiddenAtRef = useRef(0)

  const pageVisibility = usePageVisibility()

  useEffect(() => {
    if (!pageVisibility) {
      hiddenAtRef.current = Date.now()
      return
    }

    const hiddenAt = hiddenAtRef.current
    hiddenAtRef.current = 0
    if (!hiddenAt || Date.now() - hiddenAt < staleTime) {
      return
    }

    appLog("Window switch to visible, invalidate all queries")
    queryClient.invalidateQueries({
      predicate: (query) => !isManagedBySyncEngine(query),
    })
  }, [pageVisibility, queryClient])
  return null
}

export const InvalidateQueryProvider = IN_ELECTRON
  ? InvalidateQueryProviderElectron
  : InvalidateQueryProviderWebApp
