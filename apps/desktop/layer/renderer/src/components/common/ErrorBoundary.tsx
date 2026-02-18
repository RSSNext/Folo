import { tracker } from "@follow/tracker"
import type { PropsWithChildren, ReactNode } from "react"
import type { FallbackProps } from "react-error-boundary"
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary"

export type ErrorFallbackProps = Omit<FallbackProps, "resetErrorBoundary"> &
  FallbackProps & {
    resetError: () => void
  }
export type FallbackRender = (props: ErrorFallbackProps) => ReactNode

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: FallbackRender
  fallbackRender?: FallbackRender
  handled?: boolean
  beforeCapture?: (scope: unknown, error: unknown) => unknown
}

const emptyFallback: FallbackRender = () => null

export const ErrorBoundary = ({
  children,
  fallback,
  fallbackRender,
  beforeCapture,
}: ErrorBoundaryProps) => {
  const renderFallback = fallbackRender ?? fallback ?? emptyFallback

  const handleError = (rawError: unknown, info: { componentStack?: string | null }) => {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError))

    if (beforeCapture?.(info, error) === false) {
      return
    }

    void tracker.manager.captureException(error, {
      source: "desktop_error_boundary",
      component_stack: info.componentStack,
    })
  }

  return (
    <ReactErrorBoundary
      onError={handleError}
      fallbackRender={(props) =>
        renderFallback({
          ...props,
          resetError: props.resetErrorBoundary,
        })
      }
    >
      {children}
    </ReactErrorBoundary>
  )
}
