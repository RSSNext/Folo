import { cn } from "@follow/utils"
import type { ReactNode } from "react"
import { useEffect } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"
import Animated, { useAnimatedStyle } from "react-native-reanimated"

import { getSkeletonPulseOpacity, holdSkeletonPulse } from "./skeleton-pulse"

type SkeletonProps = {
  className?: string
  style?: StyleProp<ViewStyle>
}

type SkeletonPulseProps = SkeletonProps & {
  /** Pass `false` where nobody can see the placeholders or nothing is loading */
  animated?: boolean
  children: ReactNode
}

/** A placeholder shape, which pulses with the `SkeletonPulse` around it */
export const Skeleton = ({ className, style }: SkeletonProps) => (
  <View className={cn("bg-system-fill", className)} style={style} />
)

/**
 * Pulses the placeholders inside it. Every pulsing group shares one animation, which stops once
 * the last of them unmounts or holds still, so a still group draws no frames.
 */
export const SkeletonPulse = ({ animated = true, children, ...props }: SkeletonPulseProps) =>
  animated ? <PulsingView {...props}>{children}</PulsingView> : <View {...props}>{children}</View>

const PulsingView = ({ className, style, children }: SkeletonProps & { children: ReactNode }) => {
  useEffect(() => holdSkeletonPulse(), [])
  const opacity = getSkeletonPulseOpacity()
  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }))

  return (
    <Animated.View className={className} style={[style, pulseStyle]}>
      {children}
    </Animated.View>
  )
}
