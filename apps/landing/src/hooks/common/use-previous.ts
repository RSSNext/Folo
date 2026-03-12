import { useEffect, useRef } from 'react'

export const usePrevious = <T>(value: T): (() => T | undefined) => {
  const ref = useRef<T>(undefined as T)
  useEffect(() => {
    ref.current = value
  }, [value])
  return () => ref.current
}
