import { useEffect, useRef } from 'react'

type CleanupFn = () => void | undefined
const noop = () => {}
export const useSyncEffectOnce = (effect: (() => CleanupFn) | (() => void)) => {
  const ref = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    return cleanupRef.current || noop
  }, [])

  if (ref.current) return
  cleanupRef.current = effect() || null
  ref.current = true
}
