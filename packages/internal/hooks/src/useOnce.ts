import { useEffect, useRef } from "react"

export const useOnce = (fn: () => any) => {
  const isDone = useRef(false)
  useEffect(() => {
    if (isDone.current) return
    fn()
    isDone.current = true
  }, [])
}
