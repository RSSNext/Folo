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
        "mx-auto max-w-md text-text-secondary",

        // Shine effect
        "bg-clip-text bg-repeat-x",

        styles["shiny-text"],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
