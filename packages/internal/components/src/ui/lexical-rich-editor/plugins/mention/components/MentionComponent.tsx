import { cn } from "@follow/utils"
import { m as motion } from "motion/react"
import * as React from "react"
import { useState } from "react"

import type { MentionData } from "../types"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionComponentProps {
  mentionData: MentionData
  className?: string
}

const MentionTooltip = ({
  mentionData,
  isVisible,
}: {
  mentionData: MentionData
  isVisible: boolean
}) => {
  if (!isVisible) return null

  return (
    <motion.div
      className={cn(
        "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform",
        "bg-material-thick border-fill-secondary rounded-lg border shadow-lg backdrop-blur-xl",
        "pointer-events-none max-w-xs px-3 py-2",
      )}
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
        duration: 0.15,
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <div className="bg-fill border-fill-secondary flex size-6 flex-shrink-0 items-center justify-center rounded-full border">
          <MentionTypeIcon type={mentionData.type} />
        </div>
        <div>
          <p className="text-text text-sm font-medium">@{mentionData.name}</p>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium",
              mentionData.type === "entry" && "bg-blue text-black",
              mentionData.type === "feed" && "bg-orange text-black",
            )}
          >
            {mentionData.type}
          </span>
        </div>
      </div>

      {/* Tooltip arrow */}
      <div className="absolute left-1/2 top-full -translate-x-1/2 transform">
        <div className="bg-material-thick border-fill-secondary size-2 rotate-45 transform border-b border-r" />
      </div>
    </motion.div>
  )
}

export const MentionComponent: React.FC<MentionComponentProps> = ({ mentionData, className }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getMentionStyles = (type: MentionData["type"]) => {
    const baseStyles = cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
      "font-medium text-sm cursor-pointer transition-all duration-200",
      "hover:scale-105 active:scale-95",
      "border",
    )

    switch (type) {
      case "entry": {
        return cn(
          baseStyles,
          "bg-blue/10 text-blue border-blue/20",
          "hover:bg-blue/20 hover:border-blue/30",
        )
      }
      case "feed": {
        return cn(
          baseStyles,
          "bg-orange/10 text-orange border-orange/20",
          "hover:bg-orange/20 hover:border-orange/30",
        )
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Handle mention click - could navigate to user profile, topic page, etc.
    console.log("Mention clicked:", mentionData)
  }

  return (
    <span className="relative inline-block">
      <motion.span
        className={cn(getMentionStyles(mentionData.type), className)}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 400,
          duration: 0.1,
        }}
      >
        <MentionTypeIcon type={mentionData.type} />
        <span>@{mentionData.name}</span>
      </motion.span>

      <MentionTooltip mentionData={mentionData} isVisible={isHovered} />
    </span>
  )
}

MentionComponent.displayName = "MentionComponent"
