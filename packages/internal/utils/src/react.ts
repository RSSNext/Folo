import type { ComponentType, ReactElement } from "react"
import { createElement, Suspense } from "react"

type FallbackOptions = ReactElement | ComponentType

interface WithSuspenseOptions {
  fallback?: FallbackOptions
}

/**
 * Higher-order component that wraps a component with React Suspense
 * @param Component - The component to wrap with Suspense
 * @param options - Configuration options for the Suspense wrapper
 * @returns A new component wrapped with Suspense
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  options: WithSuspenseOptions = {},
): ComponentType<P> {
  const { fallback } = options

  const WrappedComponent = (props: P) => {
    const fallbackElement = typeof fallback === "function" ? createElement(fallback) : fallback

    return createElement(Suspense, { fallback: fallbackElement }, createElement(Component, props))
  }

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || "Component"})`

  return WrappedComponent
}
