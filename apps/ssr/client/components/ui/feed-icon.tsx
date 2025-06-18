import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { PlatformIcon } from "@follow/components/ui/platform-icon/index.jsx"
import type { CombinedEntryModel, FeedModel, FeedOrListRespModel } from "@follow/models/types"
import { getBackgroundGradient } from "@follow/utils/color"
import { getImageProxyUrl, replaceImgUrlIfNeed } from "@follow/utils/img-proxy"
import { cn, getUrlIcon } from "@follow/utils/utils"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { useMemo } from "react"

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
  | (Pick<FeedModel, "ownerUserId" | "id" | "title" | "url" | "image"> & {
      type: FeedOrListRespModel["type"]
      siteUrl?: string
    })
  | FeedOrListRespModel

type FeedIconEntry = Pick<CombinedEntryModel["entries"], "media" | "authorAvatar">
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
  const image =
    (useMedia
      ? entry?.media?.find((i) => i.type === "photo")?.url || entry?.authorAvatar
      : entry?.authorAvatar) || feed?.image

  const colors = useMemo(
    () => getBackgroundGradient(feed?.title || (feed as FeedModel)?.url || siteUrl || ""),
    [feed?.title, (feed as FeedModel)?.url, siteUrl],
  )
  let ImageElement: ReactNode
  let finalSrc = ""

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

  const fallbackIcon = (
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

  switch (true) {
    case !feed && !!siteUrl: {
      const [src] = getFeedIconSrc({
        siteUrl,
      })
      finalSrc = src!

      const isIconLoaded = isIconLoadedSet.has(src!)
      isIconLoadedSet.add(src!)

      ImageElement = (
        <PlatformIcon url={siteUrl} style={sizeStyle} className={cn("center", className)}>
          <m.img style={sizeStyle} {...(disableFadeIn || isIconLoaded ? {} : fadeInVariant)} />
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
      const isIconLoaded = isIconLoadedSet.has(finalSrc)
      isIconLoadedSet.add(finalSrc)

      ImageElement = (
        <PlatformIcon url={image} style={sizeStyle} className={cn("center", className)}>
          <m.img
            className={cn(marginClassName, className)}
            style={sizeStyle}
            {...(disableFadeIn || isIconLoaded ? {} : fadeInVariant)}
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
          className={cn("center", className)}
        >
          <FallbackableImage
            className={cn(marginClassName, className)}
            style={sizeStyle}
            fallbackUrl={fallbackSrc!}
          />
        </PlatformIcon>
      )
      break
    }
    case feed?.type === "inbox": {
      ImageElement = (
        <i className={cn("i-mgc-inbox-cute-fi shrink-0", marginClassName)} style={sizeStyle} />
      )
      break
    }
    case !!feed?.title && !!feed.title[0]: {
      ImageElement = fallbackIcon
      break
    }
    default: {
      ImageElement = (
        <i className={cn("i-mgc-link-cute-re shrink-0", marginClassName)} style={sizeStyle} />
      )
      break
    }
  }

  if (!ImageElement) {
    return null
  }

  if (fallback && !!finalSrc) {
    return (
      <Avatar className={cn("shrink-0", marginClassName)} style={sizeStyle}>
        <AvatarImage
          className="rounded-sm object-cover"
          asChild
          src={replaceImgUrlIfNeed({ url: finalSrc, inBrowser: true })}
        >
          {ImageElement}
        </AvatarImage>
        <AvatarFallback delayMs={200} asChild>
          {fallbackElement || fallbackIcon}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Is Icon
  if (!finalSrc) return ImageElement
  // Else
  return (
    <Avatar className={cn("shrink-0", marginClassName)} style={sizeStyle}>
      <AvatarImage asChild src={replaceImgUrlIfNeed({ url: finalSrc, inBrowser: true })}>
        {ImageElement}
      </AvatarImage>
      <AvatarFallback delayMs={200}>
        <div className={className} style={sizeStyle} data-placeholder={finalSrc} />
      </AvatarFallback>
    </Avatar>
  )
}
