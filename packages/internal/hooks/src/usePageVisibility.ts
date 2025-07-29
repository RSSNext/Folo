import { useLayoutEffect, useState } from "react"

export function usePageVisibility() {
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden)

  useLayoutEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden)
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return isPageVisible
}
