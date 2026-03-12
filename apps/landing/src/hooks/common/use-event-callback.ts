import { useCallback, useRef } from 'react'

export const useEventCallback = <T extends (...args: any[]) => any>(fn: T) => {
  const ref = useRef<T>(fn)
  ref.current = fn

  return useCallback((...args: any[]) => ref.current(...args), []) as T
}
