import type { FC } from "react"
import { createElement } from "react"

import type { ErrorComponentType } from "../errors/enum"
import { AppErrorBoundary } from "./AppErrorBoundary"

interface WithErrorBoundaryOptions {
  errorType: ErrorComponentType | ErrorComponentType[]
  height?: number | string
}

/**
 * Higher-order component that wraps a component with AppErrorBoundary
 * @param Component - The component to wrap with ErrorBoundary
 * @param options - Configuration options for the ErrorBoundary wrapper
 * @returns A new component wrapped with ErrorBoundary
 */
export function withAppErrorBoundary<P extends object>(
  Component: FC<P>,
  options: WithErrorBoundaryOptions,
): FC<P> {
  const { errorType, height } = options

  const WrappedComponent = (props: P) => {
    return createElement(AppErrorBoundary, { errorType, height }, createElement(Component, props))
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`

  return WrappedComponent as FC<P>
}
