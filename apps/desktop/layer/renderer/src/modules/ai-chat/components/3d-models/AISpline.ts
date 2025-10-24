import { cn } from "@follow/utils"
import { ErrorBoundary } from "@sentry/react"
import { createElement, lazy, Suspense } from "react"

const AISplineLoader = lazy(() =>
  import("./AISplineLoader").then((res) => ({ default: res.AISplineLoader })),
)
export const AISpline = ({ className }: { className?: string }) => {
  return createElement(
    ErrorBoundary,
    {
      handled: true,
    },
    createElement(
      Suspense,
      {
        fallback: createElement("div", { className: cn("size-20 mx-auto", className) }),
      },
      createElement(AISplineLoader, { className }),
    ),
  )
}
