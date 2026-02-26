import { useEffect, useRef } from 'react'

export const useStateToRef = <T>(state: T) => {
  const ref = useRef(state)
  useEffect(() => {
    ref.current = state
  }, [state])
  return ref
}
