import * as React from "react"

import type { MentionType } from "../../types"

interface MentionTypeIconProps {
  type: MentionType
  className?: string
}

export const MentionTypeIcon: React.FC<MentionTypeIconProps> = ({ type, className = "size-3" }) => {
  switch (type) {
    case "entry": {
      return <i className={`i-mgc-paper-cute-fi ${className}`} />
    }
    case "feed": {
      return <i className={`i-mgc-rss-cute-fi ${className}`} />
    }
    default: {
      return <i className={`i-mgc-ai-cute-re ${className}`} />
    }
  }
}

MentionTypeIcon.displayName = "MentionTypeIcon"
