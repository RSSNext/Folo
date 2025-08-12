import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import type { ComponentType, ReactNode } from "react"
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
  return function <P extends { part: { state: string; output?: T } }>(
    WrappedComponent: ComponentType<P & { output: NonNullable<T> }>,
  ): ComponentType<P> {
    const WithDisplayStateHandler = toolMemo((props: P) => {
      const { part } = props

      // Handle error state
      if (part.state === "output-error") {
        return (
          <ErrorState
            title={config.errorTitle}
            error={`An error occurred while loading ${config.title.toLowerCase()}`}
            maxWidth={config.maxWidth || "max-w-6xl"}
          />
        )
      }

      // Handle loading/invalid state
      if (part.state !== "output-available" || !part.output) {
        return (
          <LoadingState
            title={`Loading ${config.title}...`}
            description={config.loadingDescription}
            maxWidth={config.maxWidth || "max-w-6xl"}
          />
        )
      }

      // Render the wrapped component with the validated output
      return <WrappedComponent {...props} output={part.output as NonNullable<T>} />
    })

    WithDisplayStateHandler.displayName = `withDisplayStateHandler(${WrappedComponent.displayName || WrappedComponent.name})`

    return WithDisplayStateHandler
  }
}

// Common card wrapper for display components
export const DisplayCardWrapper = ({
  title,
  emoji,
  description,
  children,
  maxWidth = "max-w-6xl",
}: {
  title: string
  emoji: string
  description?: string
  children: ReactNode
  maxWidth?: string
}) => (
  <Card className={`mb-2 w-full min-w-0 ${maxWidth}`}>
    <div className="w-[9999px] max-w-[calc(var(--ai-chat-layout-width,65ch)_-120px)]" />
    <CardHeader>
      <CardTitle className="text-text flex items-center gap-2 text-xl font-semibold">
        <span className="text-lg">{emoji}</span>
        <span>{title}</span>
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="@container space-y-6">{children}</CardContent>
  </Card>
)
