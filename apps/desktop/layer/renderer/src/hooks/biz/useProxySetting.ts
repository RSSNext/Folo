import { IN_ELECTRON } from "@follow/shared/constants"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

import { ipcServices } from "~/lib/client"

const proxyAtom = atom("")

proxyAtom.onMount = (setAtom) => {
  ipcServices?.setting.getProxyConfig().then((proxy) => {
    setAtom(proxy || "")
  })
}

export const useProxyValue = () => useAtomValue(proxyAtom)

/**
 * @returns whether the proxy was accepted. The main process drops an invalid value and falls
 * back to the system proxy, and the atom then shows what it actually stored.
 */
export const useSetProxy = () => {
  const setProxy = useSetAtom(proxyAtom)
  return useCallback(
    async (proxyString: string) => {
      if (!IN_ELECTRON || !ipcServices) {
        return false
      }
      const accepted = await ipcServices.setting.setProxyConfig(proxyString)
      const storedProxy = await ipcServices.setting.getProxyConfig()
      setProxy(storedProxy || "")
      return accepted
    },
    [setProxy],
  )
}
