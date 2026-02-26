'use client'

import { startTransition, useEffect, useState } from 'react'

export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  return isClient
}

export const useIsClientTransition = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    startTransition(() => {
      setIsClient(true)
    })
  }, [])
  return isClient
}
