import { useEffect, useRef } from 'react'

export const useIsUnMounted = () => {
  const unmounted = useRef(false)
  useEffect(() => {
    return () => {
      unmounted.current = true
    }
  }, [])

  return unmounted
}
