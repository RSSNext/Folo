import type { SpringConfig } from "react-native-reanimated/lib/typescript/animation/springUtils"

export const gentleSpringPreset: SpringConfig = {
  damping: 15,
  stiffness: 100,
  mass: 1,
}

export const softSpringPreset: SpringConfig = {
  damping: 20,
  stiffness: 80,
  mass: 1,
}

export const quickSpringPreset: SpringConfig = {
  damping: 10,
  stiffness: 200,
  mass: 1,
}
