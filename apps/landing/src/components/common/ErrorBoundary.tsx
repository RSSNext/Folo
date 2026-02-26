'use client'

import type { FC, PropsWithChildren } from 'react'
import { ErrorBoundary as ErrorBoundaryLib } from 'react-error-boundary'

import { Button } from '../ui/button'

const FallbackComponent = () => {
  return (
    <div className="center flex w-full flex-col py-6">
      Something went wrong.
      <Button
        onClick={() => {
          window.location.reload()
        }}
      >
        Reload Page
      </Button>
    </div>
  )
}
export const ErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ErrorBoundaryLib
      FallbackComponent={FallbackComponent}
      onError={(e) => {
        console.error(e)

        // TODO  sentry

        // captureException(e)
      }}
    >
      {children}
    </ErrorBoundaryLib>
  )
}
