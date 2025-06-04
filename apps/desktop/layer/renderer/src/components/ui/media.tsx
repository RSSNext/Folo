import { nextFrame } from "@follow/utils/dom"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import { useForceUpdate } from "motion/react"
import type { FC, ImgHTMLAttributes, VideoHTMLAttributes } from "react"
import { createContext, memo, use, useMemo, useState } from "react"
import { Blurhash, BlurhashCanvas } from "react-blurhash"
import { useEventCallback } from "usehooks-ts"

import { saveImageDimensionsToDb } from "~/store/image/db"

import { usePreviewMedia } from "./media/hooks"
import type { VideoPlayerRef } from "./media/VideoPlayer"
import { VideoPlayer } from "./media/VideoPlayer"

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

  const [currentState, setCurrentState] = useState<"proxy" | "origin" | "error">(() =>
    proxy && !preferOrigin ? "proxy" : "origin",
  )

  const [imgSrc, setImgSrc] = useState(() =>
    currentState === "proxy" && src
      ? getImageProxyUrl({
          url: src,
          width: proxy?.width || 0,
          height: proxy?.height || 0,
        })
      : src,
  )

  const previewImageSrc = useMemo(
    () =>
      currentState === "proxy" && previewImageUrl
        ? getImageProxyUrl({
            url: previewImageUrl,
            width: proxy?.width || 0,
            height: proxy?.height || 0,
          })
        : previewImageUrl,
    [currentState, previewImageUrl, proxy?.width, proxy?.height],
  )

  const [mediaLoadState, setMediaLoadState] = useState<"loading" | "loaded">(() => {
    if (imgSrc) {
      return isImageLoadedSet.has(imgSrc) ? "loaded" : "loading"
    }
    return "loading"
  })

  const errorHandle: React.ReactEventHandler<HTMLImageElement> = useEventCallback(() => {
    switch (currentState) {
      case "proxy": {
        if (imgSrc !== props.src && props.src) {
          setImgSrc(props.src)
        } else {
          setCurrentState("error")
        }
        break
      }
      case "origin": {
        if (imgSrc === props.src && props.src) {
          setImgSrc(
            getImageProxyUrl({
              url: props.src,
              width: proxy?.width || 0,
              height: proxy?.height || 0,
            }),
          )
        } else {
          setCurrentState("error")
        }
        break
      }
    }
  })

  const isError = currentState === "error"
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

const MediaContainerWidthContext = createContext<number>(0)
export const MediaContainerWidthProvider = ({
  children,
  width,
}: {
  children: React.ReactNode
  width: number
}) => {
  return <MediaContainerWidthContext value={width}>{children}</MediaContainerWidthContext>
}

const useMediaContainerWidth = () => {
  return use(MediaContainerWidthContext)
}

export type MediaInfoRecord = Record<string, { width?: number; height?: number }>
const MediaInfoRecordContext = createContext<MediaInfoRecord>({})

const noop = {} as const
export const MediaInfoRecordProvider = ({
  children,
  mediaInfo,
}: {
  children: React.ReactNode
  mediaInfo?: Nullable<MediaInfoRecord>
}) => {
  return <MediaInfoRecordContext value={mediaInfo || noop}>{children}</MediaInfoRecordContext>
}
