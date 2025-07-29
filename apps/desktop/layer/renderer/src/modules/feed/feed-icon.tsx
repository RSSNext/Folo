// import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { PlatformIcon } from "@follow/components/ui/platform-icon/index.jsx"
import type { FeedOrListRespModel } from "@follow/models/types"
import type { FeedModel } from "@follow/store/feed/types"
import type { ListModel } from "@follow/store/list/types"
import { getBackgroundGradient } from "@follow/utils/color"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn, getUrlIcon } from "@follow/utils/utils"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { useMemo } from "react"

const { Avatar, AvatarFallback, AvatarImage } = AvatarPrimitive

// Size-responsive border radius utility function
const getBorderRadius = (size: number) => {
  if (size <= 24) return "rounded-sm" // 2px for small avatars
  if (size <= 32) return "rounded-md" // 6px for medium avatars
  if (size <= 48) return "rounded-lg" // 8px for large avatars
  return "rounded-xl" // 12px for extra large avatars
}

function getIconProps(
  props: Pick<
    Parameters<typeof FeedIcon>[0],
    "feed" | "entry" | "useMedia" | "siteUrl" | "fallbackUrl" | "fallback" | "size"
  >,
) {
  const { feed, entry, useMedia, siteUrl: propSiteUrl, fallbackUrl, fallback, size = 20 } = props
  const image =
    (useMedia ? entry?.firstPhotoUrl || entry?.authorAvatar : entry?.authorAvatar) || feed?.image
  const siteUrl = (feed as FeedModel)?.siteUrl || fallbackUrl

  if (propSiteUrl && !feed) {
    const [src] = getFeedIconSrc({
      siteUrl: propSiteUrl,
    })
    return {
      type: "image" as const,
      src,
      platformUrl: propSiteUrl,
      fallbackSrc: "",
    }
  }
  if (image) {
    return {
      type: "image" as const,
      src: getImageProxyUrl({
        url: image,
        width: size * 2,
        height: size * 2,
      }),
      platformUrl: image,
      fallbackSrc: "",
    }
  }

  if (siteUrl) {
    const [src, fallbackSrc] = getFeedIconSrc({
      siteUrl,
      fallback,
      proxy: {
        width: size * 2,
        height: size * 2,
      },
    })
    return {
      type: "image" as const,
      src,
      platformUrl: siteUrl,
      fallbackSrc,
    }
  }
  if (feed?.type === "inbox") {
    return {
      type: "inbox" as const,
    }
  }

  if (feed?.title) {
    return {
      type: "text" as const,
    }
  }

  return {
    type: "default" as const,
  }
}

const getFeedIconSrc = ({
  src,
  siteUrl,
  fallback,
  proxy,
}: {
  src?: string
  siteUrl?: string
  fallback?: boolean
  proxy?: { height: number; width: number }
} = {}) => {
  if (src) {
    if (proxy) {
      return [
        getImageProxyUrl({
          url: src,
          width: proxy.width,
          height: proxy.height,
        }),
        "",
      ]
    }

    return [src, ""]
  }
  if (!siteUrl) return ["", ""]
  const ret = getUrlIcon(siteUrl, fallback)

  return [ret.src, ret.fallbackUrl]
}

const FallbackableImage = function FallbackableImage({
  ref,
  fallbackUrl,
  ...rest
}: {
  fallbackUrl: string
} & React.ImgHTMLAttributes<HTMLImageElement> & {
    ref?: React.Ref<HTMLImageElement | null>
  }) {
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
}

type FeedIconFeed =
  | Pick<FeedModel, "ownerUserId" | "id" | "title" | "url" | "image" | "siteUrl" | "type">
  | ListModel
  | FeedOrListRespModel

export type FeedIconEntry = { authorAvatar?: string | null; firstPhotoUrl?: string | null }
const fadeInVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const isIconLoadedSet = new Set<string>()
export function FeedIcon({
  feed,
  entry,
  fallbackUrl,
  className,
  size = 20,
  fallback = true,
  fallbackElement,
  siteUrl,
  useMedia,
  disableFadeIn,
  noMargin,
}: {
  feed?: FeedIconFeed | null
  entry?: FeedIconEntry | null
  fallbackUrl?: string
  className?: string
  size?: number
  siteUrl?: string
  /**
   * Image loading error fallback to site icon
   */
  fallback?: boolean
  fallbackElement?: ReactNode

  useMedia?: boolean
  disableFadeIn?: boolean
  noMargin?: boolean
}) {
  const marginClassName = noMargin ? "" : "mr-2"
  const iconProps = getIconProps({ feed, entry, useMedia, siteUrl, fallbackUrl, fallback, size })

  const colors = useMemo(
    () => getBackgroundGradient(feed?.title || (feed as FeedModel)?.url || siteUrl || ""),
    [feed?.title, (feed as FeedModel)?.url, siteUrl],
  )

  const sizeStyle: React.CSSProperties = useMemo(
    () => ({
      width: size,
      height: size,
    }),
    [size],
  )
  const colorfulStyle: React.CSSProperties = useMemo(() => {
    const [, , , bgAccent, bgAccentLight, bgAccentUltraLight] = colors
    return {
      backgroundImage: `linear-gradient(to top, ${bgAccent} 0%, ${bgAccentLight} 99%, ${bgAccentUltraLight} 100%)`,

      ...sizeStyle,
    }
  }, [colors, sizeStyle])

  const textFallbackIcon = (
    <span
      style={colorfulStyle}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm",
        "text-white",
        marginClassName,
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

  let imageElement: ReactNode
  let finalSrc = ""

  switch (iconProps.type) {
    case "image": {
      finalSrc = iconProps.src!
      const isIconLoaded = isIconLoadedSet.has(finalSrc)
      isIconLoadedSet.add(finalSrc)
      const { fallbackSrc } = iconProps

      imageElement = (
        <PlatformIcon url={iconProps.platformUrl!} style={sizeStyle} className={className}>
          {fallbackSrc ? (
            <FallbackableImage
              className={cn(marginClassName, className)}
              style={sizeStyle}
              fallbackUrl={fallbackSrc}
            />
          ) : (
            <m.img
              className={cn(marginClassName, className)}
              style={sizeStyle}
              {...(disableFadeIn || isIconLoaded ? {} : fadeInVariant)}
            />
          )}
        </PlatformIcon>
      )
      break
    }
    case "inbox": {
      imageElement = (
        <i className={cn("i-mgc-inbox-cute-fi shrink-0", marginClassName)} style={sizeStyle} />
      )
      break
    }
    case "text": {
      imageElement = textFallbackIcon
      break
    }
    case "default": {
      imageElement = (
        <i className={cn("i-mgc-link-cute-re shrink-0", marginClassName)} style={sizeStyle} />
      )
      break
    }
  }

  if (!imageElement) {
    return null
  }

  const fallbackIcon = fallbackElement || textFallbackIcon

  if (finalSrc) {
    return (
      <Avatar className={cn("shrink-0 [&_*]:select-none", marginClassName)} style={sizeStyle}>
        <AvatarImage className={cn("object-cover", getBorderRadius(size))} asChild src={finalSrc}>
          {imageElement}
        </AvatarImage>
        <AvatarFallback delayMs={200} asChild>
          {fallback ? fallbackIcon : <div />}
        </AvatarFallback>
      </Avatar>
    )
  }

  return imageElement
}
