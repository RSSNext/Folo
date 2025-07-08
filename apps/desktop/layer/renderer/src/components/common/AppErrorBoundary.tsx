import type { FallbackRender } from "@sentry/react"
import { ErrorBoundary } from "@sentry/react"
import type { FC, PropsWithChildren } from "react"
import { createElement, Suspense, useCallback } from "react"

import { getErrorFallback } from "../errors"
import type { ErrorComponentType } from "../errors/enum"
import PageErrorFallback from "../errors/PageError"

export interface AppErrorBoundaryProps extends PropsWithChildren {
  height?: number | string
  errorType: ErrorComponentType
}

export const AppErrorBoundary: FC<
  Omit<AppErrorBoundaryProps, "errorType"> & {
    errorType: ErrorComponentType[] | ErrorComponentType
  }
> = ({ errorType, children }) => {
  if (Array.isArray(errorType)) {
    return (
      <>
        {errorType.reduceRight(
          (acc, type) => (
            <AppErrorBoundaryItem key={type} errorType={type}>
              {acc}
            </AppErrorBoundaryItem>
          ),
          children,
        )}
      </>
    )
  }

  return <AppErrorBoundaryItem errorType={errorType}>{children}</AppErrorBoundaryItem>
}

type ErrorFallbackProps = Parameters<FallbackRender>["0"]
export type AppErrorFallbackProps = ErrorFallbackProps & {}
const AppErrorBoundaryItem: FC<AppErrorBoundaryProps> = ({ errorType, children }) => {
  const fallbackRender = useCallback(
    (fallbackProps: ErrorFallbackProps) => {
      const errorElement = getErrorFallback(errorType)
      if (!errorElement) {
        return <PageErrorFallback {...fallbackProps} />
      }
      return <Suspense>{createElement(getErrorFallback(errorType), fallbackProps)}</Suspense>
    },
    [errorType],
  )

  return <ErrorBoundary fallback={fallbackRender}>{children}</ErrorBoundary>
}
