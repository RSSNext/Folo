import { useRef } from 'react'

export const useBeforeMounted = (fn: () => any) => {
  const effectOnce = useRef(false)

  if (!effectOnce.current) {
    effectOnce.current = true
    fn?.()
  }
}
