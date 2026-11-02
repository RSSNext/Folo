import type { RefObject } from "react"

export type NavigationScrollTarget = RefObject<unknown>

/**
 * The lists a tap on the selected tab scrolls to the top, by tab. A list registers while it is
 * the shown one of its tab, so a list on another tab or on a page the user left cannot take the
 * tap, and the latest one wins when the next list registers before the last one leaves.
 */
export const createNavigationScrollTargets = () => {
  const targetsByTab = new Map<number, NavigationScrollTarget[]>()

  return {
    /** Registers the shown list of a tab; returns the function that unregisters it */
    register(tabScreenIndex: number, target: NavigationScrollTarget) {
      const targets = (targetsByTab.get(tabScreenIndex) ?? []).filter((t) => t !== target)
      targetsByTab.set(tabScreenIndex, [...targets, target])

      return () => {
        const remaining = (targetsByTab.get(tabScreenIndex) ?? []).filter((t) => t !== target)
        if (remaining.length > 0) {
          targetsByTab.set(tabScreenIndex, remaining)
        } else {
          targetsByTab.delete(tabScreenIndex)
        }
      }
    },

    get(tabScreenIndex: number): NavigationScrollTarget | undefined {
      return targetsByTab.get(tabScreenIndex)?.at(-1)
    },
  }
}

export type NavigationScrollTargets = ReturnType<typeof createNavigationScrollTargets>

type NativeScrollRefOwner = { getNativeScrollRef: () => unknown }

const ownsNativeScrollRef = (scroller: object): scroller is NativeScrollRefOwner =>
  "getNativeScrollRef" in scroller && typeof scroller.getNativeScrollRef === "function"

/**
 * The scroll view to find the native view of, if the list has one now. FlashList's handle is a
 * copy of its scroll view made when the list mounted, so the current one comes from
 * `getNativeScrollRef`.
 */
export const getNativeScrollView = (scroller: object): object | null => {
  if (!ownsNativeScrollRef(scroller)) return scroller
  const nativeScrollRef = scroller.getNativeScrollRef()
  return typeof nativeScrollRef === "object" ? nativeScrollRef : null
}
