import { cn } from "@follow/utils"
import { createElement, lazy, Suspense } from "react"

import { ErrorBoundary } from "~/components/common/ErrorBoundary"

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
