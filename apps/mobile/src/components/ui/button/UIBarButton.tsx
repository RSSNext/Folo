import { cn } from "@follow/utils"
import type { PressableProps } from "react-native"
import { Pressable, TouchableOpacity } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"

interface UIBarButtonProps extends PressableProps {
  label: string

  selected?: boolean

  normalIcon: React.ReactNode
  selectedIcon?: React.ReactNode

  overlay?: boolean
}

export const UIBarButton = ({
  normalIcon,
  selectedIcon,
  onPress,
  selected,
  label,
  overlay = true,

  ...props
}: UIBarButtonProps) => {
  const hasDifferentIcon = selectedIcon && normalIcon

  const ButtonComponent = hasDifferentIcon ? Pressable : TouchableOpacity
  return (
    <ButtonComponent
      className={cn(
        "relative flex size-10 items-center justify-center",
        props.disabled && "opacity-50",
      )}
      // @ts-expect-error
      onPress={onPress}
      aria-label={label}
      {...props}
    >
      {selected && overlay && <ButtonOverlay />}

      {!hasDifferentIcon ? (
        normalIcon
      ) : (
        <IconTransition
          icon1={normalIcon}
          icon2={selectedIcon}
          current={selected ? "icon2" : "icon1"}
        />
      )}
    </ButtonComponent>
  )
}

const fadeInAnimation = FadeIn.springify().damping(10).stiffness(100)
const fadeOutAnimation = FadeOut.springify().damping(10).stiffness(100)

const ButtonOverlay = () => {
  return (
    <Animated.View
      entering={fadeInAnimation}
      exiting={fadeOutAnimation}
      className="absolute inset-0 rounded-lg bg-system-fill"
    />
  )
}

const IconTransition = ({
  icon1,
  icon2,
  current,
}: {
  icon1: React.ReactNode
  icon2: React.ReactNode
  current: "icon1" | "icon2"
}) => {
  return (
    <Animated.View entering={fadeInAnimation} exiting={fadeOutAnimation} key={current}>
      {current === "icon1" ? icon1 : icon2}
    </Animated.View>
  )
}
