import type { TrackerPoints } from "@follow/tracker"
import { tracker } from "@follow/tracker"
import type { AllTrackers } from "@follow/tracker/src/points"
import { memo, useState } from "react"
import { useInView } from "react-intersection-observer"

type ImpressionProps<T extends AllTrackers> = {
  event: T
  onTrack?: () => any
  properties?: Parameters<TrackerPoints[T]>
  children: React.ReactNode
}

export function ImpressionView<T extends keyof typeof tracker>(
  props: ImpressionProps<T> & { shouldTrack?: boolean },
) {
  const { shouldTrack = true, ...rest } = props
  if (!shouldTrack) {
    return <>{props.children}</>
  }
  return <MemoImpressionViewImpl {...rest} />
}

function ImpressionViewImpl<T extends keyof typeof tracker>(props: ImpressionProps<T>) {
  const [impression, setImpression] = useState(false)

  const { ref } = useInView({
    initialInView: false,
    triggerOnce: true,
    onChange(inView) {
      if (!inView) {
        return
      }
      setImpression(true)

      // @ts-expect-error
      tracker[props.event]?.apply(null, props.properties)
      props.onTrack?.()
    },
  })

  return (
    <>
      {props.children}
      {!impression && <span ref={ref} />}
    </>
  )
}
const MemoImpressionViewImpl = memo(ImpressionViewImpl)
MemoImpressionViewImpl.displayName = "ImpressionView"
