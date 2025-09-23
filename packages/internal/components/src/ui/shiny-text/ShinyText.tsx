import { clsx } from "@follow/utils"
import * as React from "react"

import styles from "./index.module.css"

interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2,
  className = "",
}) => {
  const animationDuration = `${speed}s`

  return (
    <div
      className={clsx(styles["shiny-text"], disabled ? styles["disabled"] : "", className)}
      style={{ animationDuration }}
    >
      {text}
    </div>
  )
}
