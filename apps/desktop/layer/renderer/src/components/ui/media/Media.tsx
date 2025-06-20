import { nextFrame } from "@follow/utils/dom"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import { useForceUpdate } from "motion/react"
import type { FC, ImgHTMLAttributes, VideoHTMLAttributes } from "react"
import * as React from "react"
import { memo, use, useEffect, useMemo, useRef, useState } from "react"
import { Blurhash, BlurhashCanvas } from "react-blurhash"
import { useEventCallback } from "usehooks-ts"

import { saveImageDimensionsToDb } from "~/store/image/db"

import { useMediaContainerWidth, usePreviewMedia } from "./hooks"
import { MediaInfoRecordContext } from "./MediaInfoRecordContext"
import type { VideoPlayerRef } from "./VideoPlayer"
import { VideoPlayer } from "./VideoPlayer"

type BaseProps = {
  mediaContainerClassName?: string
  showFallback?: boolean
  thumbnail?: boolean
  blurhash?: string
  inline?: boolean
  fitContent?: boolean
}

const isImageLoadedSet = new Set<string>()
export type MediaProps = BaseProps &
  (
    | (ImgHTMLAttributes<HTMLImageElement> & {
        proxy?: {
          width: number
          height: number
        }
        preferOrigin?: boolean
        popper?: boolean
        type: "photo"
        previewImageUrl?: string
        cacheDimensions?: boolean
      })
    | (VideoHTMLAttributes<HTMLVideoElement> & {
        proxy?: {
          width: number
          height: number
        }
        preferOrigin?: boolean
        popper?: boolean
        type: "video"
        previewImageUrl?: string
      })
  )

const MediaImpl: FC<MediaProps> = ({
  className,
  proxy,
  preferOrigin,
  popper = false,
  mediaContainerClassName,
  thumbnail,
  ...props
}) => {
  const {
    src,
    style,
    type,
    previewImageUrl,
    showFallback,
    blurhash,
    height,
    width,
    inline,
    fitContent,
    ...rest
  } = props

  const ctxMediaInfo = use(MediaInfoRecordContext)
  const ctxHeight = ctxMediaInfo[src!]?.height
  const ctxWidth = ctxMediaInfo[src!]?.width

  const finalHeight = height || ctxHeight
  const finalWidth = width || ctxWidth

  // Define the list of available image sources, sorted by priority
  const imageSources = useMemo(() => {
    if (!src) return []

    const sources: Array<{ url: string; type: "proxy" | "origin" }> = []

    // Determine priority based on preferences
    if (proxy && !preferOrigin) {
      // Use proxy first
      sources.push(
        {
          url: getImageProxyUrl({
            url: src,
            width: proxy.width || 0,
            height: proxy.height || 0,
          }),
          type: "proxy",
        },
        { url: src, type: "origin" },
      )
    } else {
      // Use original URL first
      sources.push({ url: src, type: "origin" })
      if (proxy) {
        sources.push({
          url: getImageProxyUrl({
            url: src,
            width: proxy.width || 0,
            height: proxy.height || 0,
          }),
          type: "proxy",
        })
      }
    }

    return sources
  }, [src, proxy, preferOrigin])

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0)
  const [isError, setIsError] = useState(false)
  const [mediaLoadState, setMediaLoadState] = useState<"loading" | "loaded">("loading")

  const currentSource = imageSources[currentSourceIndex]
  const imgSrc = currentSource?.url || src

  const previewImageSrc = useMemo(() => {
    if (!previewImageUrl) return

    // Use the same proxy strategy for preview images
    if (proxy && currentSource?.type === "proxy") {
      return getImageProxyUrl({
        url: previewImageUrl,
        width: proxy.width || 0,
        height: proxy.height || 0,
      })
    }
    return previewImageUrl
  }, [previewImageUrl, proxy, currentSource?.type])

  // When image source list changes, reset to the first source
  const prevImageSources = useRef(imageSources)
  useEffect(() => {
    if (prevImageSources.current !== imageSources && imageSources.length > 0) {
      prevImageSources.current = imageSources
      setCurrentSourceIndex(0)
      setIsError(false)
    }
  }, [imageSources])

  // When image source changes, reset loading state
  const prevImgSrc = useRef(imgSrc)
  useEffect(() => {
    if (prevImgSrc.current !== imgSrc) {
      prevImgSrc.current = imgSrc
      setMediaLoadState(imgSrc && isImageLoadedSet.has(imgSrc) ? "loaded" : "loading")
    }
  }, [imgSrc])

  const errorHandle: React.ReactEventHandler<HTMLImageElement> = useEventCallback((e) => {
    const nextIndex = currentSourceIndex + 1

    if (import.meta.env.DEV) {
      console.info(
        `[Media Error] Failed to load image source ${currentSourceIndex + 1}/${imageSources.length}`,
        {
          failedSrc: imgSrc,
          originalSrc: src,
          error: e,
          willRetry: nextIndex < imageSources.length,
          nextSource: imageSources[nextIndex]?.url,
        },
      )
    }

    if (nextIndex < imageSources.length) {
      //  Try next available image source
      setCurrentSourceIndex(nextIndex)
      setMediaLoadState("loading")
    } else {
      // All sources failed, mark as error state
      setIsError(true)

      if (import.meta.env.DEV) {
        console.error(`[Media Error] All image sources failed for: ${src}`, {
          allSources: imageSources,
          originalSrc: src,
        })
      }
    }
  })

  const previewMedia = usePreviewMedia()
  const handleClick = useEventCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (popper && src) {
      const width = Number.parseInt(props.width as string)
      const height = Number.parseInt(props.height as string)
      previewMedia(
        [
          {
            url: src,
            type,
            fallbackUrl: imgSrc,
            blurhash: props.blurhash,
            width: width || undefined,
            height: height || undefined,
          },
        ],
        0,
      )
    }
    props.onClick?.(e as any)
  })
  const handleOnLoad: React.ReactEventHandler<HTMLImageElement> = useEventCallback((e) => {
    setMediaLoadState("loaded")
    rest.onLoad?.(e as any)

    if (import.meta.env.DEV) {
      console.info(`[Media Success] Image loaded successfully`, {
        src: imgSrc,
        originalSrc: src,
        sourceType: currentSource?.type,
        sourceIndex: currentSourceIndex + 1,
        totalSources: imageSources.length,
        dimensions: {
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
          ratio: e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
        },
        loadTime: performance.now(),
      })
    }

    if (imgSrc) {
      isImageLoadedSet.add(imgSrc)
    }
    if ("cacheDimensions" in props && props.cacheDimensions && src) {
      saveImageDimensionsToDb(src, {
        src,
        width: e.currentTarget.naturalWidth,
        height: e.currentTarget.naturalHeight,
        ratio: e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
        blurhash: props.blurhash,
      })
    }
  })

  const containerWidth = useMediaContainerWidth()

  const InnerContent = useMemo(() => {
    switch (type) {
      case "photo": {
        // @ts-expect-error
        const { cacheDimensions, ...props } = rest
        return (
          <img
            height={finalHeight}
            width={finalWidth}
            {...(props as ImgHTMLAttributes<HTMLImageElement>)}
            onError={errorHandle}
            className={cn(
              "size-full object-contain",
              inline && "inline size-auto align-sub",
              popper && "cursor-zoom-in",
              "duration-200",
              mediaLoadState === "loaded" ? "opacity-100" : "opacity-0",
              "!my-0",
              mediaContainerClassName,
            )}
            src={imgSrc}
            onLoad={handleOnLoad}
            onClick={handleClick}
          />
        )
      }
      case "video": {
        return (
          <span
            className={cn(
              "center",
              !(finalWidth || finalHeight) && "size-full",
              "cursor-card relative bg-stone-100 object-cover",
              mediaContainerClassName,
            )}
            onClick={handleClick}
          >
            <VideoPreview src={src!} previewImageUrl={previewImageSrc} thumbnail={thumbnail} />
          </span>
        )
      }
      default: {
        return null
      }
    }
  }, [
    errorHandle,
    handleClick,
    handleOnLoad,
    imgSrc,
    mediaContainerClassName,
    finalHeight,
    finalWidth,
    mediaLoadState,
    popper,
    previewImageSrc,
    rest,
    src,
    thumbnail,
    type,
    inline,
  ])

  if (!type || !src) return null

  if (isError) {
    if (showFallback) {
      return (
        <FallbackMedia
          mediaContainerClassName={mediaContainerClassName}
          className={className}
          style={style}
          {...props}
        />
      )
    } else {
      return (
        <div
          className={cn("relative overflow-hidden rounded", className)}
          data-state={mediaLoadState}
          style={props.style}
        >
          <span
            className={cn(
              "bg-material-ultra-thick relative inline-block max-w-full",
              mediaContainerClassName,
            )}
            style={{
              aspectRatio:
                props.height && props.width ? `${props.width} / ${props.height}` : undefined,
              width: props.width ? `${props.width}px` : "100%",
            }}
          >
            {props.blurhash && (
              <span
                className={cn(
                  "absolute inset-0 overflow-hidden rounded",
                  mediaLoadState === "loaded" && "animate-out fade-out-0 fill-mode-forwards",
                )}
              >
                <BlurhashCanvas hash={props.blurhash} className="size-full" />
              </span>
            )}
          </span>
        </div>
      )
    }
  }

  return (
    <span
      data-state={type !== "video" ? mediaLoadState : undefined}
      data-media-debug={
        import.meta.env.DEV
          ? JSON.stringify({
              originalSrc: src,
              currentSrc: imgSrc,
              sourceType: currentSource?.type,
              sourceIndex: currentSourceIndex,
              totalSources: imageSources.length,
              isError,
              mediaLoadState,
            })
          : undefined
      }
      className={cn("relative overflow-hidden rounded", inline ? "inline" : "block", className)}
      style={style}
    >
      {!!props.width && !!props.height && !!containerWidth ? (
        <AspectRatio
          width={Number.parseInt(props.width as string)}
          height={Number.parseInt(props.height as string)}
          containerWidth={containerWidth}
          fitContent={fitContent}
        >
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center overflow-hidden rounded",
              mediaLoadState === "loaded" && "animate-out fade-out-0 fill-mode-forwards",
            )}
            data-blurhash={blurhash}
          >
            {blurhash ? (
              <Blurhash hash={blurhash} width="100%" height="100%" />
            ) : (
              <div className="bg-border size-full" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded">
            {InnerContent}
          </div>
        </AspectRatio>
      ) : (
        InnerContent
      )}
    </span>
  )
}

export const Media: FC<MediaProps> = memo((props) => <MediaImpl {...props} key={props.src} />)

const FallbackMedia: FC<MediaProps> = ({ type, mediaContainerClassName, className, ...props }) => (
  <div className={className} style={props.style}>
    <div
      className={cn(
        "size-full",
        "center bg-material-ultra-thick rounded",
        "not-prose @container !flex max-h-full flex-col space-y-1 p-4",
        mediaContainerClassName,
      )}
    >
      <div className="@sm:hidden @md:contents hidden">
        <i className="i-mgc-close-cute-re text-red text-xl" />
        <p>Media loaded failed</p>
        <div className="space-x-1 break-all px-4 text-sm">
          Go to{" "}
          <a href={props.src} target="_blank" rel="noreferrer" className="follow-link--underline">
            original media url
          </a>
          <i className="i-mgc-external-link-cute-re translate-y-0.5" />
        </div>
      </div>
    </div>
  </div>
)

const AspectRatio = ({
  width,
  height,
  containerWidth,
  children,
  style,
  fitContent,
  ...props
}: {
  width: number
  height: number
  containerWidth?: number
  children: React.ReactNode
  style?: React.CSSProperties
  /**
   * If `fit` is true, the content width may be increased to fit the container width
   */
  fitContent?: boolean
  [key: string]: any
}) => {
  const scaleFactor =
    containerWidth && width
      ? fitContent
        ? containerWidth / width
        : Math.min(1, containerWidth / width)
      : 1

  const scaledWidth = width ? width * scaleFactor : undefined
  const scaledHeight = height ? height * scaleFactor : undefined

  return (
    <div
      style={{
        position: "relative",
        width: scaledWidth ? `${scaledWidth}px` : "100%",
        height: scaledHeight ? `${scaledHeight}px` : "auto",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

const VideoPreview: FC<{
  src: string
  previewImageUrl?: string
  thumbnail?: boolean
}> = ({ src, previewImageUrl, thumbnail = false }) => {
  const [isInitVideoPlayer, setIsInitVideoPlayer] = useState(!previewImageUrl)

  const [videoRef, setVideoRef] = useState<VideoPlayerRef | null>(null)
  const isPaused = videoRef ? videoRef?.getState().paused : true
  const [forceUpdate] = useForceUpdate()
  return (
    <div
      className="size-full"
      onMouseEnter={() => {
        videoRef?.controls.play()?.then(forceUpdate)
      }}
      onMouseLeave={() => {
        videoRef?.controls.pause()
        nextFrame(forceUpdate)
      }}
    >
      {!isInitVideoPlayer ? (
        <img
          src={previewImageUrl}
          className="size-full object-cover"
          onMouseEnter={() => {
            setIsInitVideoPlayer(true)
          }}
        />
      ) : (
        <VideoPlayer
          variant={thumbnail ? "thumbnail" : "preview"}
          controls={false}
          src={src}
          poster={previewImageUrl}
          ref={setVideoRef}
          muted
          className="relative size-full object-cover"
        />
      )}

      <div
        className={cn(
          "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-3xl text-white/80 duration-200",
          isPaused ? "opacity-100" : "opacity-0",
        )}
      >
        <i className="i-mgc-play-cute-fi" />
      </div>
    </div>
  )
}
