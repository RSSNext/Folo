'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

import { ErrorBoundary } from '~/components/common/ErrorBoundary'
import { cn } from '~/lib/cn'

const AISplineLoader = lazy(() =>
  import('./AISplineLoader').then((res) => ({ default: res.AISplineLoader })),
)

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

export const AISpline = ({ className }: { className?: string }) => {
  const [canRender, setCanRender] = useState(false)

  useEffect(() => {
    setCanRender(supportsWebGL())
  }, [])

  if (!canRender) {
    return <div className={cn('mx-auto size-20', className)} />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className={cn('mx-auto size-20', className)} />}>
        <AISplineLoader className={className} />
      </Suspense>
    </ErrorBoundary>
  )
}
