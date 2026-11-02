import { IN_ELECTRON } from "@follow/shared/constants"

// The desktop app and the debug proxy page keep the route in the hash (see router.tsx)
const keepsRouteInHash = () =>
  IN_ELECTRON ||
  !!(globalThis as { __DEBUG_PROXY__?: unknown }).__DEBUG_PROXY__ ||
  window.location.pathname.startsWith("/__debug_proxy")

/**
 * Reload on the app's start page. After the account changed, the page that was open, such as
 * an entry of one of its feeds, belongs to the account before: opened again, it would show to
 * the next account and be marked read for it.
 */
export const reloadAtAppRoot = () => {
  window.history.replaceState(null, "", keepsRouteInHash() ? "#/" : "/")
  window.location.reload()
}
