import { useTypeScriptHappyCallback } from "@follow/hooks"
import crashlytics from "@react-native-firebase/crashlytics"
import { createElement, useEffect } from "react"
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary"
import { Text, View } from "react-native"

export const ErrorBoundary = ({
  children,
  fallbackRender,
}: {
  children: React.ReactNode
  fallbackRender?: (props: { error: Error; resetError: () => void }) => React.ReactNode
}) => {
  return (
    <ReactErrorBoundary
      fallbackRender={useTypeScriptHappyCallback(
        ({ error, resetErrorBoundary }) => {
          return (
            <>
              {typeof fallbackRender === "function"
                ? createElement(fallbackRender, { error, resetError: resetErrorBoundary })
                : defaultFallbackRender({ error })}
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
      <Text>{error.message}</Text>
    </View>
  )
}

const ErrorReport = ({ error }: { error: Error }) => {
  useEffect(() => {
    crashlytics().recordError(error)

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
