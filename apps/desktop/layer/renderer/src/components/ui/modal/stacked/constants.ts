import { Spring } from "@follow/components/constants/spring.js"
import type { MotionProps, TargetAndTransition } from "motion/react"

const enterStyle: TargetAndTransition = {
  scale: 1,
  opacity: 1,
}
const initialStyle: TargetAndTransition = {
  scale: 0.96,
  opacity: 0,
}

export const modalMontionConfig = {
  initial: initialStyle,
  animate: enterStyle,
  exit: {
    ...initialStyle,
    transition: Spring.presets.smooth,
  },
  transition: Spring.presets.snappy,
} satisfies MotionProps

// Radix context menu z-index 999
export const MODAL_STACK_Z_INDEX = 1001
