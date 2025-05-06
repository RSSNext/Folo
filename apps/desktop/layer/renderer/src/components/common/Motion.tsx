import type { TargetAndTransition } from "motion/react"
import { m as M } from "motion/react"
import { createElement } from "react"

import { useReduceMotion } from "~/hooks/biz/useReduceMotion"

const cacheMap = new Map<string, any>()
export const m: typeof M = new Proxy(M, {
  get(target, p: string) {
    const Component = target[p]

    if (cacheMap.has(p)) {
      return cacheMap.get(p)
    }
    const MotionComponent = ({ ref, ...props }) => {
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

      return createElement(Component, { ...nextProps, ref })
    }

    cacheMap.set(p, MotionComponent)

    return MotionComponent
  },
})
