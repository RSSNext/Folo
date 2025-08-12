import { cn } from "@follow/utils/utils"
import * as React from "react"

import type { FileAttachment } from "~/modules/ai-chat/store/types"

import { getImageUrl } from "./ai-block-constants"

interface ImageThumbnailProps {
  attachment: FileAttachment
  className?: string
  fallbackIcon?: string
}

/**
 * A robust image thumbnail component with proper error handling and fallback states
 */
export const ImageThumbnail: React.FC<ImageThumbnailProps> = React.memo(
  ({
    attachment,
    className = "size-3 rounded object-cover",
    fallbackIcon = "i-mgc-pic-cute-re",
  }) => {
    const [hasError, setHasError] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const imageUrl = React.useMemo(() => getImageUrl(attachment), [attachment])

    const handleError = React.useCallback(() => {
      setHasError(true)
      setIsLoading(false)
    }, [])

    const handleLoad = React.useCallback(() => {
      setIsLoading(false)
    }, [])

    // Reset error state when imageUrl changes
    React.useEffect(() => {
      if (imageUrl) {
        setHasError(false)
        setIsLoading(true)
      }
    }, [imageUrl])

    // If no image URL or there was an error, show fallback icon
    if (!imageUrl || hasError) {
      return <i className={cn("size-3", fallbackIcon)} />
    }

    return (
      <div className="relative">
        <img
          src={imageUrl}
          alt={attachment.name}
          className={cn(className, isLoading && "opacity-50")}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="i-mgc-loading-3-cute-re size-2 animate-spin opacity-50" />
          </div>
        )}
      </div>
    )
  },
)

ImageThumbnail.displayName = "ImageThumbnail"
