import { Pressable } from "react-native"

import type { NativePressableProps } from "./NativePressable.types"

/**
 * In order to resolve the conflict between the gesture handling of the native view and the RCTSurfaceGestureHandler in React Native.
 *
 */
export const NativePressable = ({ children, ...props }: NativePressableProps) => {
  return <Pressable {...props}>{children}</Pressable>
}
