import { useEffect, useMemo, useRef } from "react"
import type { NativeSyntheticEvent } from "react-native"

import { useNavigation } from "../hooks"

type LifecycleEvent = NativeSyntheticEvent<{
  dismissCount: number
}>
export const useCombinedLifecycleEvents = (
  screenId: string,
  {
    onAppear,
    onDisappear,
    onWillAppear,
    onWillDisappear,
  }: {
    onAppear?: (e: LifecycleEvent) => void
    onDisappear?: (e: LifecycleEvent) => void
    onWillAppear?: (e: LifecycleEvent) => void
    onWillDisappear?: (e: LifecycleEvent) => void
  } = {},
) => {
  const navigation = useNavigation()
  const stableRef = useRef({
    onAppear,
    onDisappear,
    onWillAppear,
    onWillDisappear,
  })

  useEffect(() => {
    stableRef.current = {
      onAppear,
      onDisappear,
      onWillAppear,
      onWillDisappear,
    }
  }, [onAppear, onDisappear, onWillAppear, onWillDisappear])
  return useMemo(() => {
    return {
      onAppear: (e: LifecycleEvent) => {
        navigation.emit("didAppear", { screenId })
        stableRef.current.onAppear?.(e)
      },
      onDisappear: (e: LifecycleEvent) => {
        navigation.emit("didDisappear", { screenId })
        stableRef.current.onDisappear?.(e)
      },
      onWillAppear: (e: LifecycleEvent) => {
        navigation.emit("willAppear", { screenId })
        stableRef.current.onWillAppear?.(e)
      },
      onWillDisappear: (e: LifecycleEvent) => {
        navigation.emit("willDisappear", { screenId })
        stableRef.current.onWillDisappear?.(e)
      },
    }
  }, [navigation, screenId])
}
