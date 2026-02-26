import { useEffect, useState } from 'react'

export const useIsMountedState = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
