import { IN_ELECTRON } from "@follow/shared/constants"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

import { tipcClient } from "~/lib/client"

const minimizeToTrayAtom = atom<boolean>(true)

minimizeToTrayAtom.onMount = (setAtom) => {
  tipcClient?.getMinimizeToTray().then((proxy: boolean) => {
    setAtom(proxy)
  })
}

export const useMinimizeToTrayValue = () => useAtomValue(minimizeToTrayAtom)

export const useSetMinimizeToTray = () => {
  const setMinimizeToTray = useSetAtom(minimizeToTrayAtom)
  return useCallback(
    (value: boolean) => {
      if (!IN_ELECTRON) return
      setMinimizeToTray(value)
      tipcClient?.setMinimizeToTray(value)
    },
    [setMinimizeToTray],
  )
}
