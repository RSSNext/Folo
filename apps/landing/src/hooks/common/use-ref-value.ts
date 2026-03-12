import { useRef } from 'react'

// @see https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents
export const useRefValue = <T>(value: () => T): T => {
  const ref = useRef<T>(undefined as T)

  if (!ref.current) {
    ref.current = value()
  }

  return ref.current!
}
