import type { Spring } from "motion/react"

const reboundPreset: Spring = {
  type: "spring",
  bounce: 10,
  stiffness: 140,
  damping: 8,
}

const microDampingPreset: Spring = {
  type: "spring",
  damping: 24,
}

const microReboundPreset: Spring = {
  type: "spring",
  stiffness: 300,
  damping: 20,
}

const softSpringPreset: Spring = {
  duration: 0.35,
  type: "spring",
  stiffness: 120,
  damping: 20,
}

const softBouncePreset: Spring = {
  type: "spring",
  damping: 10,
  stiffness: 100,
}

/**
 * A smooth spring with a predefined duration and no bounce.
 */
const smoothPreset: Spring = {
  type: "spring",
  duration: 0.4,
  bounce: 0,
}

/**
 * A spring with a predefined duration and small amount of bounce that feels more snappy.
 */
const snappyPreset: Spring = {
  type: "spring",
  duration: 0.4,
  bounce: 0.15,
}

/**
 * A spring with a predefined duration and higher amount of bounce.
 */
const bouncyPreset: Spring = {
  type: "spring",
  duration: 0.4,
  bounce: 0.3,
}
class SpringPresets {
  rebound = reboundPreset
  microDamping = microDampingPreset
  microRebound = microReboundPreset
  softSpring = softSpringPreset
  softBounce = softBouncePreset
  smooth = smoothPreset
  snappy = snappyPreset
  bouncy = bouncyPreset
}
class SpringStatic {
  presets = new SpringPresets()

  /**
   * A smooth spring with a predefined duration and no bounce that can be tuned.
   *
   * @param duration The perceptual duration, which defines the pace of the spring.
   * @param extraBounce How much additional bounce should be added to the base bounce of 0.
   */
  smooth(duration = 0.4, extraBounce = 0): Spring {
    return {
      type: "spring",
      duration,
      bounce: extraBounce,
    }
  }

  /**
   * A spring with a predefined duration and small amount of bounce that feels more snappy.
   */
  snappy(duration = 0.4, extraBounce = 0): Spring {
    return {
      type: "spring",
      duration,
      bounce: 0.15 + extraBounce,
    }
  }

  /**
   * A spring with a predefined duration and higher amount of bounce that can be tuned.
   */
  bouncy(duration = 0.4, extraBounce = 0): Spring {
    return {
      type: "spring",
      duration,
      bounce: 0.3 + extraBounce,
    }
  }
}

const SpringClass = new SpringStatic()
export { SpringClass as Spring }
