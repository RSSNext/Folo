import { cn } from "@follow/utils/utils"
import * as HoverCard from "@radix-ui/react-hover-card"
import { m } from "motion/react"
import * as React from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import type { FileAttachment } from "~/modules/ai-chat/store/types"

import { getImageUrl } from "./ai-block-constants"

type AttachmentImageProps = {
  attachment: FileAttachment
  className?: string
  fallbackIcon?: string
}

type ImageThumbnailProps = AttachmentImageProps

/**
 * Unified ImageThumbnail with hover preview, click-to-modal, loading and error fallbacks
 */
export const ImageThumbnail: React.FC<ImageThumbnailProps> = React.memo((props) => {
  const { present } = useModalStack()

  const [contentImageError, setContentImageError] = React.useState(false)

  const computed = React.useMemo(() => {
    const { attachment, className, fallbackIcon } = props
    const imageUrl = getImageUrl(attachment)
    const { name, serverUrl } = attachment
    const original = serverUrl || imageUrl || null
    return {
      previewUrl: imageUrl,
      originalUrl: original,
      alt: name,
      filename: name,
      className: className ?? "size-3 rounded object-cover",
      fallbackIcon: fallbackIcon ?? "i-mgc-pic-cute-re",
    }
  }, [props])

  React.useEffect(() => {
    setContentImageError(false)
  }, [computed.previewUrl])

  // If no preview URL available, show fallback icon
  if (!computed.previewUrl) {
    return <i className={cn("size-3", computed.fallbackIcon)} />
  }

  return (
    <HoverCard.Root openDelay={300} closeDelay={100}>
      <HoverCard.Trigger
        className="cursor-pointer"
        onClick={() =>
          computed.originalUrl &&
          present({
            max: true,
            title: "Preview Image",
            clickOutsideToDismiss: true,
            content: () => (
              <div className="flex max-h-full max-w-full items-center justify-center">
                <img src={computed.originalUrl!} className="max-h-full max-w-full" />
              </div>
            ),
          })
        }
      >
        <ImageThumbnailInner
          src={computed.previewUrl}
          alt={computed.alt}
          className={computed.className}
        />
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="w-fit rounded-md border border-border bg-material-thick shadow-lg"
          sideOffset={8}
        >
          <div className="relative overflow-hidden rounded-md">
            {contentImageError ? (
              <div className="flex h-32 w-40 items-center justify-center rounded-md border border-border bg-fill-secondary">
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <i className="i-mgc-photo-album-cute-fi size-6" />
                  <span className="text-xs">{computed.filename}</span>
                </div>
              </div>
            ) : (
              <m.img
                src={computed.previewUrl}
                alt={computed.alt}
                onError={() => setContentImageError(true)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="max-h-[300px] max-w-[400px] rounded-md"
              />
            )}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
})

ImageThumbnail.displayName = "ImageThumbnail"

const ImageThumbnailInner: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className,
}) => {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

  const handleError = React.useCallback(() => {
    setImageError(true)
  }, [])

  const handleLoad = React.useCallback(() => {
    setImageLoaded(true)
  }, [])

  if (imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border border-border bg-fill-secondary",
          className,
        )}
      >
        <i className="i-mgc-photo-album-cute-re size-3 text-text-tertiary" />
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!imageLoaded && (
        <div
          className={
            "absolute inset-0 flex items-center justify-center border border-border bg-fill-secondary"
          }
        >
          <i className="i-mgc-loading-3-cute-re size-3 animate-spin text-text-tertiary" />
        </div>
      )}
      <m.img
        src={src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={"size-full object-cover"}
      />
    </div>
  )
}
