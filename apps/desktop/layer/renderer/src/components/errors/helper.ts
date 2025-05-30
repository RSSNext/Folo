import type { FC } from "react"
import { createElement, useEffect, useRef } from "react"
import { useLocation } from "react-router"

import type { AppErrorFallbackProps } from "../common/AppErrorBoundary"

export const parseError = (error: unknown): { message?: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    }
  } else {
    return {
      message: String(error),
      stack: undefined,
    }
  }
}

export const useResetErrorWhenRouteChange = (resetError: () => void) => {
  const location = useLocation()
  const currentPathnameRef = useRef(location.pathname)
  const onceRef = useRef(false)
  useEffect(() => {
    if (onceRef.current) {
      return
    }
    if (currentPathnameRef.current !== location.pathname) {
      resetError()
      onceRef.current = true
    }
  }, [location.pathname])
}

export const withErrorGrand = <T extends Error, S extends new (...args: any[]) => T>(
  error: S,
  Component: FC<AppErrorFallbackProps>,
): FC<AppErrorFallbackProps> => {
  return (props: AppErrorFallbackProps) => {
    if (!(props.error instanceof error)) {
      throw error
    }

    return createElement(Component, props)
  }
}
