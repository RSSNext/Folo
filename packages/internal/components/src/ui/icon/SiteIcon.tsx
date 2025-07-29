import { cn } from "@follow/utils/utils"
import { m, useAnimationControls } from "motion/react"
import { useRef } from "react"

import { getFeedIconSrc } from "../../utils/icon"
import { PlatformIcon } from "../platform-icon"

interface SiteIconProps {
  siteUrl: string
  className?: string
  size?: number
  fadeIn?: boolean
}
export const SiteIcon = ({ siteUrl, className, size = 20, fadeIn = true }: SiteIconProps) => {
  const [src] = getFeedIconSrc({
    siteUrl,
  })

  const sizeStyle = {
    width: size,
    height: size,
  }

  const isIconLoaded = useRef(false)
  const fadeInVariant = {
    opacity: [0, 1],
    transition: {
      duration: 0.2,
    },
  }

  const animateControl = useAnimationControls()
  return (
    <PlatformIcon url={siteUrl} style={sizeStyle} className={cn("center", className)}>
      <m.img
        style={sizeStyle}
        src={src}
        animate={animateControl}
        onLoad={() => {
          if (isIconLoaded.current) {
            return
          }
          if (!fadeIn) {
            isIconLoaded.current = true
            return
          }
          isIconLoaded.current = true
          animateControl.start(fadeInVariant)
        }}
      />
    </PlatformIcon>
  )
}
