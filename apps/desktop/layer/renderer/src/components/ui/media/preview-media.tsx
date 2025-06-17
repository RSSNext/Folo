import { Spring } from "@follow/components/constants/spring.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import type { MediaModel } from "@follow/shared/hono"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import useEmblaCarousel from "embla-carousel-react"
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"
import type { FC } from "react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ReactZoomPanPinchRef, ReactZoomPanPinchState } from "react-zoom-pan-pinch"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

import { m } from "~/components/common/Motion"
import { COPY_MAP } from "~/constants"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"

import { useCurrentModal } from "../modal/stacked/hooks"
import { VideoPlayer } from "./VideoPlayer"

const Wrapper: FC<{
  src: string

  children: [React.ReactNode, React.ReactNode | undefined] | React.ReactNode
  className?: string
}> = ({ children, src }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const isArray = Array.isArray(children)
  const hasSideContent = isArray && !!children[1]

  return (
    <div ref={containerRef} className="fixed inset-0">
      <m.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={Spring.presets.snappy}
        className="bg-material-medium-dark flex size-full backdrop-blur"
      >
        <div
          className={cn(
            "group/left relative flex h-full w-0 grow overflow-hidden",
            hasSideContent ? "min-w-96 items-center justify-center" : "px-6",
          )}
        >
          <HeaderActions src={src} />
          {isArray ? children[0] : children}
        </div>
        {hasSideContent ? (
          <div
            className="bg-background box-border flex h-full w-[400px] min-w-0 shrink-0 flex-col px-2 pt-1"
            onClick={stopPropagation}
          >
            {children[1]}
          </div>
        ) : undefined}
      </m.div>
    </div>
  )
}

const HeaderActions: FC<{
  src: string
}> = ({ src }) => {
  const { t } = useTranslation(["shortcuts", "common"])

  const { dismiss } = useCurrentModal()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] flex h-16 items-center justify-end gap-2 px-3">
      <HeaderButton description={t(COPY_MAP.OpenInBrowser())} onClick={() => window.open(src)}>
        <i className="i-mgc-external-link-cute-re" />
      </HeaderButton>
      <HeaderButton
        description={t("common:words.download")}
        onClick={() => {
          const a = document.createElement("a")
          a.href = src
          a.download = src.split("/").pop()!
          a.target = "_blank"
          a.rel = "noreferrer"
          a.click()
        }}
      >
        <i className="i-mgc-download-2-cute-re" />
      </HeaderButton>

      <HeaderButton
        description={t("common:words.close")}
        className="ml-3 !bg-[#121212] !opacity-100"
        onClick={dismiss}
      >
        <i className="i-mgc-close-cute-re" />
      </HeaderButton>
    </div>
  )
}

const HeaderButton: FC<{
  description: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}> = ({ description, onClick, className, children }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className={cn(
            "hover:bg-material-ultra-thick-dark cursor-button backdrop-blur-background pointer-events-auto flex size-10 items-center justify-center rounded-full bg-transparent text-white duration-200 hover:text-white",
            "text-lg opacity-0 transition-opacity group-hover/left:opacity-100",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{description}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
export interface PreviewMediaProps extends MediaModel {
  fallbackUrl?: string
}
export const PreviewMediaContent: FC<{
  media: PreviewMediaProps[]
  initialIndex?: number
  children?: React.ReactNode
}> = ({ media, initialIndex = 0, children }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex }, [
    WheelGesturesPlugin(),
  ])
  const [currentMedia, setCurrentMedia] = useState(media[initialIndex])

  // This only to delay show
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex)

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        const realIndex = emblaApi.selectedScrollSnap()
        setCurrentMedia(media[realIndex])
        setCurrentSlideIndex(realIndex)
      })
    }
  }, [emblaApi, media])

  const { ref } = useCurrentModal()

  // Keyboard
  useEffect(() => {
    if (!emblaApi) return
    const $container = ref.current
    if (!$container) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev()
      if (e.key === "ArrowRight") emblaApi?.scrollNext()
    }
    $container.addEventListener("keydown", handleKeyDown)
    return () => $container.removeEventListener("keydown", handleKeyDown)
  }, [emblaApi, ref])

  if (media.length === 0) return null
  if (media.length === 1) {
    const src = media[0]!.url
    const { type } = media[0]!
    const isVideo = type === "video"
    return (
      <Wrapper src={src}>
        {[
          <Fragment key={src}>
            {isVideo ? (
              <VideoPlayer
                src={src}
                controls
                autoPlay
                muted
                className={cn("h-full w-auto object-contain", !!children && "rounded-l-xl")}
                onClick={stopPropagation}
              />
            ) : (
              <FallbackableImage
                fallbackUrl={media[0]!.fallbackUrl}
                className="h-full w-auto object-contain"
                alt="cover"
                src={src}
                height={media[0]!.height}
                width={media[0]!.width}
                blurhash={media[0]!.blurhash}
              />
            )}
          </Fragment>,
          children,
        ]}
      </Wrapper>
    )
  }
  return (
    <Wrapper src={currentMedia!.url}>
      {[
        <div key={"left"} className="group size-full overflow-hidden" ref={emblaRef}>
          <div className="flex size-full">
            {media.map((med) => (
              <div className="mr-2 flex w-full flex-none items-center justify-center" key={med.url}>
                {med.type === "video" ? (
                  <VideoPlayer
                    src={med.url}
                    autoPlay
                    muted
                    controls
                    className="size-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <FallbackableImage
                    fallbackUrl={med.fallbackUrl}
                    className="size-full object-contain"
                    alt="cover"
                    src={med.url}
                    loading="lazy"
                    height={med.height}
                    width={med.width}
                    blurhash={med.blurhash}
                  />
                )}
              </div>
            ))}
          </div>

          {currentSlideIndex > 0 && (
            <button
              type="button"
              className={`bg-material-medium absolute left-2 top-1/2 z-[100] flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 hover:bg-black/40 group-hover:opacity-100 lg:left-4 lg:size-10`}
              onClick={(e) => {
                e.stopPropagation()
                emblaApi?.scrollPrev()
              }}
            >
              <i className={`i-mingcute-left-line text-lg lg:text-xl`} />
            </button>
          )}

          {currentSlideIndex < media.length - 1 && (
            <button
              type="button"
              className={`bg-material-medium absolute right-2 top-1/2 z-[100] flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 hover:bg-black/40 group-hover:opacity-100 lg:right-4 lg:size-10`}
              onClick={(e) => {
                e.stopPropagation()
                emblaApi?.scrollNext()
              }}
            >
              <i className={`i-mingcute-right-line text-lg lg:text-xl`} />
            </button>
          )}

          <div className="absolute bottom-4 right-4 z-30 tabular-nums">
            {currentSlideIndex + 1} / {media.length}
          </div>
        </div>,
        children,
      ]}
    </Wrapper>
  )
}

const FallbackableImage: FC<
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string
    containerClassName?: string
    fallbackUrl?: string
    blurhash?: string
  }
> = ({ src, fallbackUrl, containerClassName }) => {
  const [currentSrc, setCurrentSrc] = useState(() => replaceImgUrlIfNeed(src))
  const [isAllError, setIsAllError] = useState(false)

  const [isLoading, setIsLoading] = useState(true)

  const [currentState, setCurrentState] = useState<"proxy" | "origin" | "fallback">(() =>
    currentSrc === src ? "origin" : "proxy",
  )

  const handleError = useCallback(() => {
    switch (currentState) {
      case "proxy": {
        if (currentSrc !== src) {
          setCurrentSrc(src)
          setCurrentState("origin")
        } else {
          if (fallbackUrl) {
            setCurrentSrc(fallbackUrl)
            setCurrentState("fallback")
          }
        }

        break
      }
      case "origin": {
        if (fallbackUrl) {
          setCurrentSrc(fallbackUrl)
          setCurrentState("fallback")
        } else {
          setIsAllError(true)
        }
        break
      }
      case "fallback": {
        setIsAllError(true)
      }
    }
  }, [currentSrc, currentState, fallbackUrl, src])

  return (
    <div className={cn("relative size-full", containerClassName)}>
      {!isAllError && currentSrc && (
        <DOMImageViewer
          minZoom={1}
          maxZoom={2}
          src={currentSrc}
          alt="preview"
          highResLoaded={!isLoading}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
      )}
      {isAllError && (
        <div
          className="center pointer-events-none absolute inset-0 flex-col gap-3"
          onClick={stopPropagation}
          tabIndex={-1}
        >
          <i className="i-mgc-close-cute-re text-[60px] text-red-400" />

          <span>Failed to load image</span>
          <div className="center gap-2">
            <MotionButtonBase
              className="pointer-events-auto underline underline-offset-4"
              onClick={() => {
                setCurrentSrc(replaceImgUrlIfNeed(src))
                setIsAllError(false)
              }}
            >
              Retry
            </MotionButtonBase>
            or
            <a
              className="pointer-events-auto underline underline-offset-4"
              href={src}
              target="_blank"
              rel="noreferrer"
            >
              Visit Original
            </a>
          </div>
        </div>
      )}

      {currentState === "fallback" && (
        <div className="bg-material-thick backdrop-blur-background text-text absolute bottom-8 left-1/2 mt-4 -translate-x-1/2 rounded-lg px-3 py-2 text-center text-xs">
          <span>
            This image is preview in low quality, because the original image is not available.
          </span>
          <br />
          <span>
            You can{" "}
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent underline duration-200"
            >
              visit the original image
            </a>{" "}
            if you want to see the full quality.
          </span>
        </div>
      )}
    </div>
  )
}

const DOMImageViewer: FC<{
  height?: number
  width?: number
  onZoomChange?: (isZoomed: boolean) => any
  minZoom: number
  maxZoom: number
  src: string
  alt: string
  highResLoaded: boolean
  onLoad?: () => void
  onError?: () => void
}> = ({
  height,
  width,
  onZoomChange,
  minZoom,
  maxZoom,
  src,
  alt,
  highResLoaded,
  onLoad,
  onError,
}) => {
  const onTransformed = useCallback(
    (ref: ReactZoomPanPinchRef, state: Omit<ReactZoomPanPinchState, "previousScale">) => {
      // 当缩放比例不等于 1 时，认为图片被缩放了
      const isZoomed = state.scale !== 1
      onZoomChange?.(isZoomed)
    },
    [onZoomChange],
  )
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.resetTransform()
    }
  }, [src])

  const { dismiss } = useCurrentModal()

  return (
    <TransformWrapper
      ref={transformRef}
      initialScale={1}
      minScale={minZoom}
      maxScale={maxZoom}
      wheel={{
        step: 0.1,
      }}
      pinch={{
        step: 0.5,
      }}
      doubleClick={{
        step: 2,
        mode: "toggle",
        animationTime: 200,
        animationType: "easeInOutCubic",
      }}
      limitToBounds={true}
      centerOnInit={true}
      smooth={true}
      onInit={(e) => {
        if (e.instance.wrapperComponent) {
          e.instance.wrapperComponent.onclick = (e) => {
            if (e.target instanceof HTMLDivElement && e.target.dataset.imageContainer) {
              e.stopPropagation()
            } else {
              dismiss()
            }
          }
        }
      }}
      alignmentAnimation={{
        sizeX: 0,
        sizeY: 0,
        velocityAlignmentTime: 0.2,
      }}
      velocityAnimation={{
        sensitivity: 1,
        animationTime: 0.2,
      }}
      onTransformed={onTransformed}
    >
      <TransformComponent
        wrapperProps={{
          onClick: stopPropagation,
        }}
        wrapperClass="!w-full !h-full !absolute !inset-0"
        contentClass="!w-full !h-full flex items-center justify-center"
      >
        <div
          className="relative inline-block h-full overflow-hidden"
          onClick={stopPropagation}
          tabIndex={-1}
          data-image-container
        >
          <img
            height={height}
            width={width}
            src={src || undefined}
            alt={alt}
            className={cn(
              "mx-auto h-full object-contain",
              highResLoaded ? "opacity-100" : "opacity-0",
            )}
            draggable={false}
            loading="eager"
            decoding="async"
            onLoad={onLoad}
            onClick={stopPropagation}
            onError={onError}
          />
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
