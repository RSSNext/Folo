import { cn } from "@follow/utils/utils"
import type { Transition } from "motion/react"
import { m as motion } from "motion/react"
import * as React from "react"

import { Spring } from "../../constants/spring"
import { Tooltip, TooltipTrigger } from "../tooltip"

type AvatarProps = {
  children: React.ReactNode
  zIndex: number
  transition: Transition
  translate: string | number
}

const AvatarContainer = React.memo(({ children, zIndex, transition, translate }: AvatarProps) => {
  return (
    <TooltipTrigger asChild>
      <motion.div
        data-slot="avatar-container"
        initial="initial"
        whileHover="hover"
        whileTap="hover"
        className="relative"
        style={{ zIndex }}
      >
        <motion.div
          variants={{
            initial: { translateY: 0 },
            hover: { translateY: translate },
          }}
          transition={transition}
        >
          {children}
        </motion.div>
      </motion.div>
    </TooltipTrigger>
  )
})

type AvatarGroupProps = Omit<React.ComponentProps<"div">, "translate"> & {
  children: React.ReactElement[]
  transition?: Transition
  translate?: string | number
}

function AvatarGroup({
  ref,
  children,
  className,
  transition = Spring.presets.smooth,
  translate = "-10%",

  ...props
}: AvatarGroupProps) {
  return (
    <div
      ref={ref}
      data-slot="avatar-group"
      className={cn("flex h-8 flex-row items-center -space-x-2", className)}
      {...props}
    >
      {children?.map((child, index) => (
        <Tooltip delayDuration={0} key={index}>
          <AvatarContainer zIndex={index} transition={transition} translate={translate}>
            {child}
          </AvatarContainer>
        </Tooltip>
      ))}
    </div>
  )
}

export { AvatarGroup, type AvatarGroupProps }
