import type { CombinedEntryModel, FeedModel, FeedOrListRespModel } from "@follow/models/types"
import { getColorScheme, stringToHue } from "@follow/utils/color"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { forwardRef, useMemo } from "react"

import { getFeedIconSrc } from "../../utils/icon"
import { PlatformIcon } from "../platform-icon"

const FallbackableImage = forwardRef<
  HTMLImageElement,
  {
    fallbackUrl: string
  } & React.ImgHTMLAttributes<HTMLImageElement>
>(function FallbackableImage({ fallbackUrl, ...rest }, ref) {
  return (
    <img
      onError={(e) => {
        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
          e.currentTarget.src = fallbackUrl
        } else {
          rest.onError?.(e)
          // Empty svg
          e.currentTarget.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3C/svg%3E"
        }
      }}
      {...rest}
      ref={ref}
    />
  )
})
export function FeedIcon({
  feed,
  entry,
  fallbackUrl,
  className,
  size = 20,
  fallback = true,
  siteUrl,
  useMedia,
}: {
  feed?: FeedOrListRespModel
  entry?: CombinedEntryModel["entries"]
  fallbackUrl?: string
  className?: string
  size?: number
  siteUrl?: string
  /**
   * Image loading error fallback to site icon
   */
  fallback?: boolean

  useMedia?: boolean
}) {
  const image =
    (useMedia
      ? entry?.media?.find((i) => i.type === "photo")?.url || entry?.authorAvatar
      : entry?.authorAvatar) || feed?.image

  if (!feed && !siteUrl) {
    throw new Error("You must provide either a feed or a siteUrl")
  }

  const colors = useMemo(
    () =>
      getColorScheme(stringToHue(feed?.title || (feed as FeedModel)?.url || siteUrl || ""), true),
    [feed?.title, (feed as FeedModel)?.url, siteUrl],
  )
  let ImageElement: ReactNode
  let finalSrc = ""

  const sizeStyle = {
    width: size,
    height: size,
  }

  const fallbackIcon = (
    <span
      style={
        {
          ...sizeStyle,
          "--fo-light-background": colors.light.background,
          "--fo-dark-background": colors.dark.background,
        } as any
      }
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm",
        "bg-[var(--fo-light-background)] text-white dark:bg-[var(--fo-dark-background)]",
        "mr-2",
        className,
      )}
    >
      <span
        style={{
          fontSize: size / 2,
        }}
      >
        {!!feed?.title && feed.title[0]}
      </span>
    </span>
  )

  switch (true) {
    case !feed && !!siteUrl: {
      const [src] = getFeedIconSrc({
        siteUrl,
      })
      finalSrc = src!

      ImageElement = (
        <PlatformIcon url={siteUrl} style={sizeStyle} className={cn("center mr-2", className)}>
          <m.img style={sizeStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        </PlatformIcon>
      )
      break
    }
    case !!image: {
      finalSrc = getImageProxyUrl({
        url: image,
        width: size * 2,
        height: size * 2,
      })
      ImageElement = (
        <PlatformIcon url={image} style={sizeStyle} className={cn("center mr-2", className)}>
          <m.img
            className={cn("mr-2", className)}
            style={sizeStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </PlatformIcon>
      )
      break
    }
    case !!fallbackUrl:
    case !!(feed as FeedModel)?.siteUrl: {
      const [src, fallbackSrc] = getFeedIconSrc({
        siteUrl: (feed as FeedModel)?.siteUrl || fallbackUrl,
        fallback,
        proxy: {
          width: size * 2,
          height: size * 2,
        },
      })
      finalSrc = src!

      ImageElement = (
        <PlatformIcon
          url={(feed as FeedModel)?.siteUrl || fallbackUrl}
          style={sizeStyle}
          className={cn("center mr-2", className)}
        >
          <FallbackableImage
            className={cn("mr-2", className)}
            style={sizeStyle}
            fallbackUrl={fallbackSrc!}
          />
        </PlatformIcon>
      )
      break
    }
    case feed?.type === "inbox": {
      ImageElement = <i className="i-mgc-inbox-cute-fi mr-2 shrink-0" style={sizeStyle} />
      break
    }
    case !!feed?.title && !!feed.title[0]: {
      ImageElement = fallbackIcon
      break
    }
    default: {
      ImageElement = <i className="i-mgc-link-cute-re mr-2 shrink-0" style={sizeStyle} />
      break
    }
  }

  if (!ImageElement) {
    return null
  }

  if (fallback && !!finalSrc) {
    return (
      <Avatar className="shrink-0">
        <AvatarImage className="rounded-sm object-cover" asChild src={finalSrc}>
          {ImageElement}
        </AvatarImage>
        <AvatarFallback asChild>{fallbackIcon}</AvatarFallback>
      </Avatar>
    )
  }

  // Is Icon
  if (!finalSrc) return ImageElement
  // Else
  return (
    <Avatar className="shrink-0">
      <AvatarImage asChild src={finalSrc}>
        {ImageElement}
      </AvatarImage>
      <AvatarFallback>
        <div className={cn("mr-2", className)} style={sizeStyle} data-placeholder={finalSrc} />
      </AvatarFallback>
    </Avatar>
  )
}
