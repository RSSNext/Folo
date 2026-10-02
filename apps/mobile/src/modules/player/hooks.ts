import { useImageColors } from "@follow/store/image/hooks"
import { getLuminance, shadeColor } from "@follow/utils"
import { useAtomValue } from "jotai"
import { use, useMemo } from "react"

import { isNativeTabBarEnabled } from "@/src/components/layouts/tabbar/native-tab-bar"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { useScreenIsInModal } from "@/src/lib/navigation/hooks"
import { useActivePlayable } from "@/src/lib/player"

import { FLOATING_PLAYER_BAR_INSET } from "./floating-player-bar"

const defaultBackgroundColor = "#000000"

export function useCoverGradient(url?: string) {
  const imageColors = useImageColors(url)

  const backgroundColor = useMemo(() => {
    if (imageColors?.platform === "ios") {
      return imageColors.background
    } else if (imageColors?.platform === "android") {
      return imageColors.average
    }
    return defaultBackgroundColor
  }, [imageColors])

  const gradientColors = useMemo(() => {
    const shadedColor = shadeColor(backgroundColor, -51)
    return [shadedColor, shadedColor] as const
  }, [backgroundColor])

  const isGradientLight = useMemo(() => {
    return getLuminance(gradientColors[0]) > 0.5
  }, [gradientColors])

  return { isGradientLight, gradientColors }
}

const playerBarTabIdentifiers = new Set(["IndexTabScreen", "SubscriptionsTabScreen"])

/**
 * Player bars show while something is playing and the Home or Subscriptions tab is selected,
 * which includes the screens pushed from those tabs.
 */
export function useShouldShowPlayerBar() {
  const activePlayable = useActivePlayable()
  const { tabScreensAtom, currentIndexAtom } = use(BottomTabContext)
  const tabScreens = useAtomValue(tabScreensAtom)
  const currentIndex = useAtomValue(currentIndexAtom)
  const identifier = tabScreens.find(
    (tabScreen) => tabScreen.tabScreenIndex === currentIndex,
  )?.identifier
  return !!activePlayable && !!identifier && playerBarTabIdentifiers.has(identifier)
}

/**
 * Bottom space a pushed screen keeps free for the floating player bar. Zero with the native tab
 * bar, whose glass player bar floats over content, and inside modals, which never show the bar.
 */
export function useFloatingPlayerBarInset() {
  const showPlayerBar = useShouldShowPlayerBar()
  const isInModal = useScreenIsInModal()
  return showPlayerBar && !isNativeTabBarEnabled && !isInModal ? FLOATING_PLAYER_BAR_INSET : 0
}
