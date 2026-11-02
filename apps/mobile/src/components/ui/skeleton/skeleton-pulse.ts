import type { SharedValue } from "react-native-reanimated"
import {
  cancelAnimation,
  Easing,
  makeMutable,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import { createSharedAnimation } from "./shared-animation"

// The timing of Tailwind's animate-pulse: half opacity halfway through a 2 s cycle
const PULSE_HALF_CYCLE_MS = 1000
const PULSE_MIN_OPACITY = 0.5

let pulseOpacity: SharedValue<number> | undefined

/** The opacity of every pulsing skeleton, so a screen of placeholders runs a single animation */
export const getSkeletonPulseOpacity = () => {
  pulseOpacity ??= makeMutable(1)
  return pulseOpacity
}

/** Keeps the pulse running while held; call the returned function to let go */
export const holdSkeletonPulse = createSharedAnimation({
  start: () => {
    getSkeletonPulseOpacity().set(
      withRepeat(
        withTiming(PULSE_MIN_OPACITY, {
          duration: PULSE_HALF_CYCLE_MS,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        true,
      ),
    )
  },
  stop: () => {
    const opacity = getSkeletonPulseOpacity()
    cancelAnimation(opacity)
    opacity.set(1)
  },
})
