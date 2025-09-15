import type { ComponentType } from "react"
import { memo } from "react"
import isEqual from "react-fast-compare"

import { ErrorState, LoadingState } from "../shared/common-states"

interface PartWithState {
  part: {
    state: string
  }
}

export const toolMemo = <P extends PartWithState>(FC: ComponentType<P>): ComponentType<P> =>
  memo(FC, (prev, next) => {
    if (prev.part.state === "output-available") return true
    return isEqual(prev, next)
  }) as ComponentType<P>

// Higher-Order Component for display state handling
export function withDisplayStateHandler<T>(config: {
  title: string
  loadingDescription: string
  errorTitle: string
  maxWidth?: string
}) {
  return function <P extends { part: { state: string; output?: T; input?: any } }>(
    WrappedComponent: ComponentType<P & { output: NonNullable<T>; input: any }>,
  ): ComponentType<P> {
    const WithDisplayStateHandler = toolMemo((props: P) => {
      const { part } = props

      // Handle error state
      if (part.state === "output-error") {
        return (
          <ErrorState error={`An error occurred while loading ${config.title.toLowerCase()}`} />
        )
      }

      // Handle loading/invalid state
      if (part.state !== "output-available" || !part.output) {
        return <LoadingState description={config.loadingDescription} />
      }

      // Render the wrapped component with the validated output
      return (
        <WrappedComponent {...props} output={part.output as NonNullable<T>} input={part.input} />
      )
    })

    WithDisplayStateHandler.displayName = `withDisplayStateHandler(${WrappedComponent.displayName || WrappedComponent.name})`

    return WithDisplayStateHandler
  }
}
