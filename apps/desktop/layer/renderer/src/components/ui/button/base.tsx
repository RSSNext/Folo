import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import type { HTMLMotionProps, Variants } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import * as React from "react"
import { cloneElement, useRef, useState } from "react"

interface AnimatedCommandButtonProps {
  icon: React.JSX.Element
  variant?: "solid" | "outline" | "ghost"
}

const iconVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0,
  },
}

export const AnimatedCommandButton: FC<AnimatedCommandButtonProps & HTMLMotionProps<"button">> = ({
  icon,
  className,
  style,
  variant = "solid",
  ...props
}) => {
  const [pressed, setPressed] = useState(false)
  const timerRef = useRef<any>(undefined)

  return (
    <MotionButtonBase
      type="button"
      className={cn(
        "center pointer-events-auto flex text-xs",
        "rounded-md p-1.5 duration-200",
        variant === "solid" || variant === "ghost"
          ? "border-accent/5 bg-accent/80 text-accent border backdrop-blur"
          : "text-accent hover:bg-material-ultra-thick",
        variant === "ghost" && "bg-theme-item-active hover:bg-theme-item-hover",
        className,
      )}
      onClick={useTypeScriptHappyCallback(
        (e) => {
          setPressed(true)
          props.onClick?.(e)
          timerRef.current = setTimeout(() => {
            setPressed(false)
          }, 2000)
        },
        [props.onClick],
      )}
      style={style}
    >
      <AnimatePresence mode="wait">
        {pressed ? (
          <m.i key="copied" className="i-mgc-check-filled size-4" {...iconVariants} />
        ) : (
          cloneElement(icon, {
            className: cn(icon.props.className, "size-4"),
            ...iconVariants,
          })
        )}
      </AnimatePresence>
    </MotionButtonBase>
  )
}
