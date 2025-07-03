import { IN_ELECTRON } from "@follow/shared/constants"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

import { ipcServices } from "~/lib/client"

const minimizeToTrayAtom = atom<boolean>(true)

minimizeToTrayAtom.onMount = (setAtom) => {
  const result = ipcServices?.setting.getMinimizeToTray()
  Promise.resolve(result).then((proxy) => {
    if (typeof proxy === "boolean") {
      setAtom(proxy)
    }
  })
}

export const useMinimizeToTrayValue = () => useAtomValue(minimizeToTrayAtom)

export const useSetMinimizeToTray = () => {
  const setMinimizeToTray = useSetAtom(minimizeToTrayAtom)
  return useCallback(
    (value: boolean) => {
      if (!IN_ELECTRON) return
      setMinimizeToTray(value)
      ipcServices?.setting.setMinimizeToTray(value)
    },
    [setMinimizeToTray],
  )
}
