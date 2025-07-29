import { Skeleton } from "@follow/components/ui/skeleton/index.js"
import type { DotLottieReactProps } from "@lottiefiles/dotlottie-react"
import type { PropsWithoutRef } from "react"
import { lazy, Suspense } from "react"

const LazyDotLottieComponent = lazy(async () => {
  const { DotLottieReact } = await import("@lottiefiles/dotlottie-react")
  return { default: DotLottieReact }
})

export const LazyDotLottie = (props: PropsWithoutRef<DotLottieReactProps>) => {
  return (
    <Suspense fallback={<Skeleton className={props.className} />}>
      <LazyDotLottieComponent {...props} />
    </Suspense>
  )
}
