import type { PrimitiveAtom } from "jotai"
import { useStore } from "jotai"
import { createContext, use, useCallback } from "react"

export interface ScreenOptionsContextType {
  gestureEnabled?: boolean
  preventNativeDismiss?: boolean

  nativeHeader?: boolean
  headerLeftArea?: React.ReactNode
  headerRightArea?: React.ReactNode
  headerTitleArea?: React.ReactNode
}
export const ScreenOptionsContext = createContext<PrimitiveAtom<ScreenOptionsContextType>>(null!)

export const useSetScreenOptions = () => {
  const ctx = use(ScreenOptionsContext)
  if (!ctx) {
    throw new Error("ScreenOptionsContext not found")
  }

  const store = useStore()
  return useCallback(
    (options: ScreenOptionsContextType) => {
      const prev = store.get(ctx)
      store.set(ctx, { ...prev, ...options })
    },
    [store, ctx],
  )
}

export const ModalScreenItemOptionsContext = createContext<PrimitiveAtom<ScreenOptionsContextType>>(
  null!,
)

export const useSetModalScreenOptions = () => {
  const ctx = use(ModalScreenItemOptionsContext)

  const store = useStore()
  return useCallback(
    (options: ScreenOptionsContextType) => {
      if (!ctx) {
        return
      }

      const prev = store.get(ctx)
      store.set(ctx, { ...prev, ...options })
    },
    [store, ctx],
  )
}
