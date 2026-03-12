import { createElement, lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { cn } from '~/lib/cn'

const AISplineLoader = lazy(() =>
  import('./AISplineLoader').then((res) => ({ default: res.AISplineLoader })),
)
export const AISpline = ({ className }: { className?: string }) => {
  return createElement(
    ErrorBoundary,
    null,
    createElement(
      Suspense,
      {
        fallback: createElement('div', {
          className: cn('size-20 mx-auto', className),
        }),
      },
      createElement(AISplineLoader, { className }),
    ),
  )
}
