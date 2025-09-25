import { cn } from "@follow/utils"
import type { ComponentPropsWithoutRef, CSSProperties, FC } from "react"

import styles from "./index.module.css"

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number
}

export const ShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "text-text-secondary mx-auto max-w-md",

        // Shine effect
        "bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",

        // Shine gradient
        "bg-gradient-to-r from-transparent via-black/90 via-50% to-transparent dark:via-white/80",
        styles["shiny-text"],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
