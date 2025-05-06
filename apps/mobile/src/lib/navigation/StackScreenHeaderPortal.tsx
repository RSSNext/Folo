import { jotaiStore } from "@follow/utils"
import { useStore } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { use, useEffect } from "react"

import { ScreenItemContext } from "./ScreenItemContext"

export const StackScreenHeaderPortal: FC<PropsWithChildren> = ({ children }) => {
  const ctxValue = use(ScreenItemContext)

  const store = useStore()
  useEffect(() => {
    jotaiStore.set(ctxValue.Slot, {
      ...store.get(ctxValue.Slot),
      header: children,
    })
  }, [ctxValue, children, store])
  return null
}
