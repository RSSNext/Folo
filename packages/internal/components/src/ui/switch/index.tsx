"use client"

import { cn } from "@follow/utils/utils"
import type { SwitchProps as SwitchPrimitiveProps } from "@headlessui/react"
import { Switch as SwitchPrimitive } from "@headlessui/react"
import type { HTMLMotionProps } from "motion/react"
import { m as motion } from "motion/react"
import * as React from "react"
import { useMemo } from "react"

import { Spring } from "../../constants/spring"

type SwitchProps<TTag extends React.ElementType = typeof motion.button> =
  SwitchPrimitiveProps<TTag> &
    Omit<HTMLMotionProps<"button">, "children"> & {
      leftIcon?: React.ReactNode
      rightIcon?: React.ReactNode
      thumbIcon?: React.ReactNode
      onCheckedChange?: (checked: boolean) => void
      as?: TTag
      size?: "sm" | "md"
    }

const THUMB_PADDING = 3
const THUMB_SIZE = 18
const SWITCH_WIDTH = 40
const THUMB_PADDING_SM = 2
const THUMB_SIZE_SM = 14
const SWITCH_WIDTH_SM = 32
function Switch({
  className,
  leftIcon,
  rightIcon,
  thumbIcon,
  onChange,
  onCheckedChange,
  as = motion.button,
  size = "md",
  ...props
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(props.checked ?? props.defaultChecked ?? false)
  const [isTapped, setIsTapped] = React.useState(false)

  React.useEffect(() => {
    setIsChecked(props.checked ?? props.defaultChecked ?? false)
  }, [props.checked, props.defaultChecked])

  const handleChange = React.useCallback(
    (checked: boolean) => {
      setIsChecked(checked)
      onCheckedChange?.(checked)
      onChange?.(checked)
    },
    [onCheckedChange, onChange],
  )

  const thumbPadding = size === "sm" ? THUMB_PADDING_SM : THUMB_PADDING
  const thumbSize = size === "sm" ? THUMB_SIZE_SM : THUMB_SIZE
  const switchWidth = size === "sm" ? SWITCH_WIDTH_SM : SWITCH_WIDTH

  const currentAnimation = useMemo(() => {
    return !props.checked
      ? { left: thumbPadding }
      : { left: switchWidth - thumbPadding - thumbSize }
  }, [props.checked, thumbPadding, thumbSize, switchWidth])

  return (
    <SwitchPrimitive
      data-slot="switch"
      checked={isChecked}
      onChange={handleChange}
      style={{ width: switchWidth, padding: thumbPadding }}
      className={cn(
        "focus-visible:ring-border cursor-switch data-[checked]:bg-accent bg-fill relative flex shrink-0 items-center justify-start rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-5" : "h-6",
        className,
      )}
      as={as}
      whileTap="tap"
      initial={false}
      onTapStart={() => {
        setIsTapped(true)
      }}
      onTapCancel={() => setIsTapped(false)}
      onTap={() => setIsTapped(false)}
      {...props}
    >
      {leftIcon && (
        <motion.div
          data-slot="switch-left-icon"
          animate={isChecked ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0 }}
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500",
            size === "sm" ? "[&_svg]:size-2.5" : "[&_svg]:size-3",
          )}
        >
          {typeof leftIcon !== "string" ? leftIcon : null}
        </motion.div>
      )}

      {rightIcon && (
        <motion.div
          data-slot="switch-right-icon"
          animate={isChecked ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0 }}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400",
            size === "sm" ? "[&_svg]:size-2.5" : "[&_svg]:size-3",
          )}
        >
          {typeof rightIcon !== "string" ? rightIcon : null}
        </motion.div>
      )}

      <motion.span
        data-slot="switch-thumb"
        whileTap="tab"
        className={cn(
          "bg-background z-[1] flex items-center justify-center rounded-full text-neutral-500 shadow-lg ring-0 dark:text-neutral-400",
          size === "sm" ? "[&_svg]:size-2.5" : "[&_svg]:size-3",
          "absolute",
        )}
        transition={Spring.presets.smooth}
        style={{
          width: thumbSize,
          height: thumbSize,
        }}
        initial={currentAnimation}
        animate={Object.assign(
          isTapped
            ? { width: size === "sm" ? 17 : 21, transition: Spring.presets.snappy }
            : { width: thumbSize },
          currentAnimation,
        )}
      >
        {thumbIcon && typeof thumbIcon !== "string" ? thumbIcon : null}
      </motion.span>
    </SwitchPrimitive>
  )
}

export { Switch, type SwitchProps }
