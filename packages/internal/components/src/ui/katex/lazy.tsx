import { lazy, Suspense } from "react"

import type { KateX } from "./index"

const LazyKateX_ = lazy(() => import("./index").then((mod) => ({ default: mod.KateX })))
export const LazyKateX: typeof KateX = (props) => {
  return (
    <Suspense>
      <LazyKateX_ {...props} />
    </Suspense>
  )
}
