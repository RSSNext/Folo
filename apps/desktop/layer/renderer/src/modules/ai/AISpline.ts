import { createElement, lazy, Suspense } from "react"

const AISplineLoader = lazy(() =>
  import("./AISplineLoader").then((res) => ({ default: res.AISplineLoader })),
)
export const AISpline = () => {
  return createElement(
    Suspense,
    {
      fallback: createElement("div", { className: "size-16 mx-auto" }),
    },
    createElement(AISplineLoader),
  )
}
