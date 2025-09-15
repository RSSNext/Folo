import { Spring } from "@follow/components/constants/spring.js"
import type { MotionProps, TargetAndTransition } from "motion/react"

const enterStyle: TargetAndTransition = {
  opacity: 1,
  // Draw the modal towards the viewer from depth
  transformPerspective: 1200,
  z: 0,
}
const initialStyle: TargetAndTransition = {
  opacity: 0,
  transformPerspective: 1200,
  z: -48,
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
