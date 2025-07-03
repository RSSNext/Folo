import { EnhanceSet } from "@follow/utils"
import { jotaiStore } from "@follow/utils/jotai"
import { atom } from "jotai"
import type { PropsWithChildren } from "react"
import { useEffect, useMemo } from "react"

import { GlobalFocusableContext } from "./context"

export const GlobalFocusableProvider = ({ children }: PropsWithChildren) => {
  const ctxValue = useMemo(() => {
    return atom(EnhanceSet.of<string>())
  }, [])

  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return jotaiStore.sub(ctxValue, () => {
        const v = jotaiStore.get(ctxValue)
        console.info("[GlobalFocusableProvider] scope changed to:", v)
      })
    }, [ctxValue])
  }

  return <GlobalFocusableContext value={ctxValue}>{children}</GlobalFocusableContext>
}
