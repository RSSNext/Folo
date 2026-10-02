import { useAtomValue, useSetAtom } from "jotai"
import { use, useCallback } from "react"

import { ScreenItemContext } from "../ScreenItemContext"
import { BottomTabContext } from "./BottomTabContext"
import type { TabScreenContextType } from "./TabScreenContext"
import { TabScreenContext } from "./TabScreenContext"

export const useScreenIsAppeared = () => {
  const { isAppearedAtom } = use(ScreenItemContext)

  return useAtomValue(isAppearedAtom)
}

export const useTabScreenIsFocused = () => {
  const { currentIndexAtom } = use(BottomTabContext)
  const currentIndex = useAtomValue(currentIndexAtom)
  const { isFocusedAtom } = use(ScreenItemContext)
  const isFocused = useAtomValue(isFocusedAtom)
  // Null outside a tab screen, e.g. in a screen pushed onto the root stack.
  const tabScreen = use(TabScreenContext) as TabScreenContextType | null

  return !!tabScreen && currentIndex === tabScreen.tabScreenIndex && isFocused
}

export const useSwitchTab = () => {
  const { currentIndexAtom } = use(BottomTabContext)
  const setCurrentIndex = useSetAtom(currentIndexAtom)
  return useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    [setCurrentIndex],
  )
}

export const useBottomTabHeight = () => {
  const { tabHeightAtom } = use(BottomTabContext)
  return useAtomValue(tabHeightAtom)
}

export const useTabScreenIdentifier = () => {
  const { identifierAtom } = use(TabScreenContext)
  return useAtomValue(identifierAtom)
}
