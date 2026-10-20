import { requireOptionalNativeModule } from "expo"
import { createContext, use, useMemo, useSyncExternalStore } from "react"

import { useScreenIsInSheetModal } from "./navigation/hooks"
import { isIOS } from "./platform"
import type { WindowControlsInsetsSource } from "./window-controls-store"
import { createWindowControlsInsetsStore, NO_WINDOW_CONTROLS_INSETS } from "./window-controls-store"

const store = createWindowControlsInsetsStore(
  isIOS ? requireOptionalNativeModule<WindowControlsInsetsSource>("Helper") : null,
)

/**
 * The sides of the window an area reaches. A side of the split layout reaches only one, so the
 * window controls in the other top corner are not in its way.
 */
export const WindowEdgesContext = createContext({ left: true, right: true })

/**
 * The room the window controls of iPadOS 26 and later (close, minimize and arrange) take past the
 * safe area in the top corner of a window that does not fill the screen. Native bars move their
 * buttons clear of them by themselves; headers drawn in React Native add this to the safe area.
 */
export const useWindowControlsInsets = () =>
  useSyncExternalStore(store.subscribe, store.getSnapshot)

/**
 * The room the header of the current screen leaves for the window controls. Screens reach the
 * window's top corner; sheets start below the controls, even in a window as narrow as a phone.
 */
export const useHeaderWindowControlsInsets = () => {
  const insets = useWindowControlsInsets()
  const sheetModal = useScreenIsInSheetModal()
  const edges = use(WindowEdgesContext)
  return useMemo(() => {
    if (sheetModal) return NO_WINDOW_CONTROLS_INSETS
    if (edges.left && edges.right) return insets
    return { left: edges.left ? insets.left : 0, right: edges.right ? insets.right : 0 }
  }, [edges.left, edges.right, insets, sheetModal])
}
