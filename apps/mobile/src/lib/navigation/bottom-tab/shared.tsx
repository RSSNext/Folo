import { useAtomValue, useSetAtom, useStore } from "jotai"
import { use, useEffect } from "react"

import { ScreenItemContext } from "../ScreenItemContext"
import { ScreenNameContext } from "../ScreenNameContext"
import { useTabScreenIsFocused } from "./hooks"
import { TabScreenContext } from "./TabScreenContext"

export const ScreenNameRegister = () => {
  const nameAtom = use(ScreenNameContext)
  const { titleAtom } = use(TabScreenContext)
  const isFocused = useTabScreenIsFocused()
  const title = useAtomValue(titleAtom)
  const store = useStore()
  useEffect(() => {
    if (isFocused) {
      store.set(nameAtom, title)
    }
  }, [isFocused, title, nameAtom, store])
  return null
}

export const TabScreenIdentifierRegister = () => {
  const { identifierAtom } = use(TabScreenContext)
  const identifier = useAtomValue(identifierAtom)
  const store = useStore()
  const isFocused = useTabScreenIsFocused()
  useEffect(() => {
    if (isFocused) {
      store.set(identifierAtom, identifier)
    }
  }, [identifier, identifierAtom, store, isFocused])
  return null
}

export const LifecycleEvents = ({ isSelected }: { isSelected: boolean }) => {
  const { isFocusedAtom, isAppearedAtom, isDisappearedAtom } = use(ScreenItemContext)
  const setIsFocused = useSetAtom(isFocusedAtom)
  const setIsAppeared = useSetAtom(isAppearedAtom)
  const setIsDisappeared = useSetAtom(isDisappearedAtom)
  useEffect(() => {
    if (isSelected) {
      setIsFocused(true)
      setIsAppeared(true)
      setIsDisappeared(false)
    } else {
      setIsFocused(false)
      setIsAppeared(false)
      setIsDisappeared(true)
    }
  }, [isSelected, setIsAppeared, setIsDisappeared, setIsFocused])
  return null
}
