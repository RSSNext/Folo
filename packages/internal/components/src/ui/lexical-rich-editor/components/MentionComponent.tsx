import { cn } from "@follow/utils"
import { m as motion } from "motion/react"
import * as React from "react"
import { useState } from "react"

import type { MentionData } from "../nodes/MentionNode"

interface MentionComponentProps {
  mentionData: MentionData
  className?: string
}

const MentionTypeIcon = ({ type }: { type: MentionData["type"] }) => {
  switch (type) {
    case "user": {
      return <i className="i-mgc-user-3-cute-re size-3" />
    }
    case "topic": {
      return <i className="i-mgc-hashtag-cute-re size-3" />
    }
    case "channel": {
      return <i className="i-mgc-hash-cute-re size-3" />
    }
    default: {
      return <i className="i-mgc-at-cute-re size-3" />
    }
  }
}

const MentionTooltip = ({
  mentionData,
  isVisible,
}: {
  mentionData: MentionData
  isVisible: boolean
}) => {
  if (!isVisible || !mentionData.description) return null

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
          {mentionData.avatar ? (
            <img
              src={mentionData.avatar}
              alt={mentionData.name}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <MentionTypeIcon type={mentionData.type} />
          )}
        </div>
        <div>
          <p className="text-text text-sm font-medium">@{mentionData.name}</p>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium",
              mentionData.type === "user" && "bg-blue text-white",
              mentionData.type === "topic" && "bg-green text-white",
              mentionData.type === "channel" && "bg-purple text-white",
            )}
          >
            {mentionData.type}
          </span>
        </div>
      </div>
      {mentionData.description && (
        <p className="text-text-secondary text-xs">{mentionData.description}</p>
      )}

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
      case "user": {
        return cn(
          baseStyles,
          "bg-blue/10 text-blue border-blue/20",
          "hover:bg-blue/20 hover:border-blue/30",
        )
      }
      case "topic": {
        return cn(
          baseStyles,
          "bg-green/10 text-green border-green/20",
          "hover:bg-green/20 hover:border-green/30",
        )
      }
      case "channel": {
        return cn(
          baseStyles,
          "bg-purple/10 text-purple border-purple/20",
          "hover:bg-purple/20 hover:border-purple/30",
        )
      }
      default: {
        return cn(
          baseStyles,
          "bg-fill text-text border-fill-secondary",
          "hover:bg-fill-secondary hover:border-fill-tertiary",
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
