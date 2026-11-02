import { atom, useAtomValueRawSync } from "jotai"
import type { PropsWithChildren, ReactNode } from "react"
import { use, useMemo, useState } from "react"
import { View } from "react-native"
import { useSharedValue } from "react-native-reanimated"
import { SafeAreaFrameContext, useSafeAreaFrame } from "react-native-safe-area-context"

import type { ScreenItemContextType } from "@/src/lib/navigation/ScreenItemContext"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { WindowEdgesContext } from "@/src/lib/window-controls"

/**
 * One side of the split layout, laid out like a screen of its own: its header sits at its top,
 * its scroll position drives only that header, and layouts measure against its own width.
 */
export const SplitPane = ({
  width,
  windowEdges,
  screenId,
  children,
}: PropsWithChildren<{
  width: number
  /** The sides of the window the pane reaches */
  windowEdges: { left: boolean; right: boolean }
  /** Given to the reader's side, so its header has no back button of the screen it is in */
  screenId?: string
}>) => {
  const screen = use(ScreenItemContext)
  const reAnimatedScrollY = useSharedValue(0)
  const scrollViewHeight = useSharedValue(0)
  const scrollViewContentHeight = useSharedValue(0)
  const [Slot] = useState(() => atom<{ header: ReactNode }>({ header: null }))
  const paneScreen = useMemo<ScreenItemContextType>(
    () => ({
      ...screen,
      screenId: screenId ?? screen.screenId,
      Slot,
      reAnimatedScrollY,
      scrollViewHeight,
      scrollViewContentHeight,
    }),
    [screen, screenId, Slot, reAnimatedScrollY, scrollViewHeight, scrollViewContentHeight],
  )
  const frame = useSafeAreaFrame()
  const paneFrame = useMemo(() => ({ ...frame, width }), [frame, width])

  return (
    <ScreenItemContext value={paneScreen}>
      <SafeAreaFrameContext value={paneFrame}>
        <WindowEdgesContext value={windowEdges}>
          <View className="h-full overflow-hidden" style={{ width }}>
            {children}
            <PaneHeader />
          </View>
        </WindowEdgesContext>
      </SafeAreaFrameContext>
    </ScreenItemContext>
  )
}

/** The header a list writes into its screen's header slot, as a pushed screen shows it */
const PaneHeader = () => {
  const { Slot } = use(ScreenItemContext)
  // Written from a layout effect in the commit that mounts this pane
  const { header } = useAtomValueRawSync(Slot)
  if (!header) return null
  return <View className="absolute inset-x-0 top-0 z-10">{header}</View>
}
