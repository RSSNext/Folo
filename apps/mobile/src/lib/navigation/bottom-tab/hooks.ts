import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useContext } from "react"

import { ScreenItemContext } from "../ScreenItemContext"
import { BottomTabContext } from "./BottomTabContext"
import { TabScreenContext } from "./TabScreenContext"

export const useScreenIsAppeared = () => {
  const { isAppearedAtom } = useContext(ScreenItemContext)

  return useAtomValue(isAppearedAtom)
}

export const useTabScreenIsFocused = () => {
  const { currentIndexAtom } = useContext(BottomTabContext)
  const currentIndex = useAtomValue(currentIndexAtom)
  const { isFocusedAtom } = useContext(ScreenItemContext)
  const isFocused = useAtomValue(isFocusedAtom)
  const { tabScreenIndex } = useContext(TabScreenContext)

  return currentIndex === tabScreenIndex && isFocused
}

export const useSwitchTab = () => {
  const { currentIndexAtom } = useContext(BottomTabContext)
  const setCurrentIndex = useSetAtom(currentIndexAtom)
  return useCallback(
    (index: number) => {
      setCurrentIndex(index)
    },
    [setCurrentIndex],
  )
}

export const useBottomTabHeight = () => {
  const { tabHeightAtom } = useContext(BottomTabContext)
  return useAtomValue(tabHeightAtom)
}

export const useTabScreenIdentifier = () => {
  const { identifierAtom } = useContext(TabScreenContext)
  return useAtomValue(identifierAtom)
}

export const useInTabScreen = () => {
  return !!useContext(TabScreenContext)
}
