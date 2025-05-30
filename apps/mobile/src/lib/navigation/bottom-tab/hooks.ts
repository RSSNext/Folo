import { useAtomValue, useSetAtom } from "jotai"
import { use, useCallback } from "react"

import { ScreenItemContext } from "../ScreenItemContext"
import { BottomTabContext } from "./BottomTabContext"
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
  const { tabScreenIndex } = use(TabScreenContext)

  return currentIndex === tabScreenIndex && isFocused
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

export const useInTabScreen = () => {
  return !!use(TabScreenContext)
}
