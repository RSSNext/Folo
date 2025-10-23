import type { WithSpringConfig } from "react-native-reanimated"

export const gentleSpringPreset: WithSpringConfig = {
  damping: 15,
  stiffness: 100,
  mass: 1,
}

export const softSpringPreset: WithSpringConfig = {
  damping: 20,
  stiffness: 80,
  mass: 1,
}

export const quickSpringPreset: WithSpringConfig = {
  damping: 10,
  stiffness: 200,
  mass: 1,
}
