import { useTypeScriptHappyCallback } from "@follow/hooks"
import { getCrashlytics, recordError } from "@react-native-firebase/crashlytics"
import type { FC } from "react"
import { createElement, useEffect } from "react"
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary"
import { View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

export const ErrorBoundary = ({
  children,
  fallbackRender,
}: {
  children: React.ReactNode
  fallbackRender: FC<{
    error: Error
    resetError: () => void
  }>
}) => {
  return (
    <ReactErrorBoundary
      fallbackRender={useTypeScriptHappyCallback(
        ({ error, resetErrorBoundary }) => {
          return (
            <>
              {typeof fallbackRender === "function"
                ? createElement(fallbackRender, {
                    error,
                    resetError: resetErrorBoundary,
                  })
                : defaultFallbackRender({
                    error,
                  })}
              <ErrorReport error={error} />
            </>
          )
        },
        [fallbackRender],
      )}
    >
      {children}
    </ReactErrorBoundary>
  )
}
const defaultFallbackRender = ({ error }: { error: Error }) => {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-label">{error.message}</Text>
    </View>
  )
}
const ErrorReport = ({ error }: { error: Error }) => {
  useEffect(() => {
    recordError(getCrashlytics(), error)
    console.error(error)
  }, [error])
  return null
}
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackRender: (props: { error: Error; resetError: () => void }) => React.ReactNode,
) => {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundary fallbackRender={fallbackRender}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`
  return WithErrorBoundaryComponent
}
