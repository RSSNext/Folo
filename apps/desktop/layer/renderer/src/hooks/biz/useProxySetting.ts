import { IN_ELECTRON } from "@follow/shared/constants"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

import { tipcClient } from "~/lib/client"

const proxyAtom = atom("")

proxyAtom.onMount = (setAtom) => {
  tipcClient?.getProxyConfig().then((proxy) => {
    setAtom(proxy || "")
  })
}

export const useProxyValue = () => useAtomValue(proxyAtom)

export const useSetProxy = () => {
  const setProxy = useSetAtom(proxyAtom)
  return useCallback(
    (proxyString: string) => {
      if (!IN_ELECTRON) {
        return
      }
      setProxy(proxyString)
      tipcClient?.setProxyConfig(proxyString)
    },
    [setProxy],
  )
}
