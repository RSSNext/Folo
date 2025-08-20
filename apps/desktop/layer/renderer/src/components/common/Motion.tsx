import type { TargetAndTransition } from "motion/react"
import { m as M } from "motion/react"
import { createElement } from "react"

import { useReduceMotion } from "~/hooks/biz/useReduceMotion"

import { isLCPEnded } from "./LCPEndDetector"

type WithLCPOptimization<P> = P & { lcpOptimization?: boolean }
// Narrow exported proxy type so each motion component accepts `lcpOptimization`
export type MotionProxy = {
  [K in keyof typeof M]: (typeof M)[K] extends React.ComponentType<infer P>
    ? React.ComponentType<WithLCPOptimization<P>>
    : (typeof M)[K]
}

const cacheMap = new Map<string, any>()
export const m: MotionProxy = new Proxy(M, {
  get(target, p: string) {
    const Component = target[p]

    if (cacheMap.has(p)) {
      return cacheMap.get(p)
    }
    const MotionComponent = ({ ref, lcpOptimization, ...props }) => {
      const shouldReduceMotion = useReduceMotion()
      const nextProps = { ...props }
      if (shouldReduceMotion) {
        if (props.exit) {
          nextProps.exit = {
            opacity: 0,
            transition: (props.exit as TargetAndTransition).transition,
          }
        }

        if (props.initial) {
          nextProps.initial = {
            opacity: 0,
          }
        }
        nextProps.animate = {
          opacity: 1,
        }
      }

      // Disable initial animation before hydration ends to optimize LCP
      if (lcpOptimization && !isLCPEnded()) {
        nextProps.initial = false
      }

      return createElement(Component, { ...nextProps, ref })
    }

    cacheMap.set(p, MotionComponent)

    return MotionComponent
  },
})
