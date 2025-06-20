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
import { useAnimationControls } from "motion/react"
import type { FC } from "react"
import * as React from "react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ReactZoomPanPinchRef, ReactZoomPanPinchState } from "react-zoom-pan-pinch"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

import { m } from "~/components/common/Motion"
import { COPY_MAP } from "~/constants"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"

import { useCurrentModal } from "../modal/stacked/hooks"
import { VideoPlayer } from "./VideoPlayer"

// Calculate the dynamic scale value and offset
const calculateDragTransforms = (x: number, y: number) => {
  // Minimum scale to 0.7, maximum keep 1.0
  const maxDistance = 300
  const dragDistance = Math.hypot(x, y)
  const progress = Math.min(dragDistance / maxDistance, 1)
  const scale = 1 - progress * 0.3 // From 1.0 to 0.7

  // Calculate the opacity, minimum to 0.5
  const opacity = 1 - progress * 0.5

  return { scale, opacity, x, y }
}

// Framer Motion variants
const modalVariants = {
  initial: { scale: 0.94, opacity: 0 },
  visible: { scale: 1, opacity: 1, x: 0, y: 0 },
  exit: { scale: 0.94, opacity: 0 },
  closing: (dragOffset: { x: number; y: number }) => ({
    scale: 0.3,
    x: dragOffset.x,
    y: dragOffset.y,
    opacity: 0,
  }),
}

const Wrapper: FC<{
  src: string
  children:
    | [React.ReactNode, React.ReactNode | undefined]
    | React.ReactNode
    | ((
        onZoomChange: (isZoomed: boolean) => void,
      ) => [React.ReactNode, React.ReactNode | undefined] | React.ReactNode)
  className?: string
  onZoomChange?: (isZoomed: boolean) => void
  canDragClose?: boolean
}> = ({ children, src, onZoomChange, canDragClose = true }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { dismiss } = useCurrentModal()
  const controls = useAnimationControls()

  // Drag close state
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Combined zoom change callback
  const handleZoomChange = useCallback(
    (isZoomed: boolean) => {
      setIsImageZoomed(isZoomed)
      onZoomChange?.(isZoomed)
    },
    [onZoomChange],
  )

  const renderedChildren = typeof children === "function" ? children(handleZoomChange) : children
  const isArray = Array.isArray(renderedChildren)
  const hasSideContent = isArray && !!renderedChildren[1]

  const enableDragClose = !isImageZoomed && canDragClose

  const handleDrag = useCallback(
    (_: any, info: any) => {
      if (!isDragging) return
      const { offset } = info
      setDragOffset(offset)

      // Real-time update the transform when dragging
      const dragTransforms = calculateDragTransforms(offset.x, offset.y)
      controls.set({
        scale: dragTransforms.scale,
        x: offset.x * 0.3,
        y: offset.y * 0.3,
        opacity: dragTransforms.opacity,
      })
    },
    [isDragging, controls],
  )

  const handleDragEnd = useCallback(
    async (_: any, info: any) => {
      const { offset, velocity } = info
      // Calculate the drag distance and velocity
      const dragDistance = Math.hypot(offset.x, offset.y)
      const velocityDistance = Math.hypot(velocity.x, velocity.y)

      // If the drag distance is greater than 100px or the overall drag distance is greater than 150px or the velocity is greater than 300, close the modal
      const shouldClose =
        offset.y > 100 || dragDistance > 150 || velocity.y > 300 || velocityDistance > 500

      if (shouldClose) {
        // Execute the closing animation
        await controls.start("closing", {
          type: "spring",
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        })
        dismiss()
      } else {
        // Reset to normal state
        setIsDragging(false)
        setDragOffset({ x: 0, y: 0 })
        controls.start("visible", {
          ...Spring.presets.snappy,
        })
      }
    },
    [controls, dismiss],
  )

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Initialize the animation
  useEffect(() => {
    controls.start("visible", {
      ...Spring.presets.snappy,
    })
  }, [controls])

  return (
    <div ref={containerRef} className="fixed inset-0">
      <m.div
        variants={modalVariants}
        initial="initial"
        animate={controls}
        exit="exit"
        custom={dragOffset}
        className="bg-material-medium-dark flex size-full pt-[var(--fo-window-padding-top)] backdrop-blur"
        drag={enableDragClose}
        dragConstraints={{ top: 0, bottom: 300, left: -200, right: 200 }}
        dragElastic={{ top: 0, bottom: 0.3, left: 0.2, right: 0.2 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          cursor: enableDragClose ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          className={cn(
            "group/left relative flex h-full w-0 grow overflow-hidden",
            hasSideContent ? "min-w-96 items-center justify-center" : "",
          )}
        >
          <HeaderActions src={src} />
          {isArray ? renderedChildren[0] : renderedChildren}
        </div>
        {hasSideContent ? (
          <div
            className="bg-background box-border flex h-full w-[400px] min-w-0 shrink-0 flex-col px-2 pt-1"
            onClick={stopPropagation}
          >
            {isArray ? renderedChildren[1] : null}
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
        className="ml-3 !border-red-500/20 !bg-red-600/30 !opacity-100 hover:!bg-red-600/50"
        onClick={dismiss}
      >
        <i className="i-mgc-close-cute-re" />
      </HeaderButton>
    </div>
  )
}

const HeaderButton: FC<{
  description?: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}> = ({ description, onClick, className, children }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <m.button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className={cn(
            // Base styles with modern glass morphism - perfect 1:1 circle
            "pointer-events-auto relative flex size-10 items-center justify-center rounded-full",
            "bg-black/20 text-white backdrop-blur-md",
            // Border and shadow for depth
            "border border-white/10 shadow-lg shadow-black/25",
            // Opacity and transition
            "opacity-0 transition-all duration-300 ease-out group-hover/left:opacity-100",
            // Text size
            "text-lg",
            className,
          )}
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/5 to-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />

          {/* Icon container */}
          <div className="center relative z-10 flex">{children}</div>

          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 rounded-full shadow-inner shadow-black/10" />
        </m.button>
      </TooltipTrigger>
      {description && (
        <TooltipPortal>
          <TooltipContent>{description}</TooltipContent>
        </TooltipPortal>
      )}
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
  onZoomChange?: (isZoomed: boolean) => void
}> = ({ media, initialIndex = 0, children, onZoomChange }) => {
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
      <Wrapper src={src} onZoomChange={onZoomChange} canDragClose>
        {(handleZoomChange) => [
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
                onZoomChange={handleZoomChange}
              />
            )}
          </Fragment>,
          children,
        ]}
      </Wrapper>
    )
  }
  return (
    <Wrapper src={currentMedia!.url} onZoomChange={onZoomChange} canDragClose={false}>
      {(handleZoomChange) => [
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
                    onZoomChange={handleZoomChange}
                  />
                )}
              </div>
            ))}
          </div>

          {currentSlideIndex > 0 && (
            <HeaderButton
              className={`absolute left-2 top-1/2 z-[100] flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 hover:bg-black/40 group-hover:opacity-100 lg:left-4 lg:size-10`}
              onClick={() => {
                emblaApi?.scrollPrev()
              }}
            >
              <i className={`i-mingcute-left-line text-lg lg:text-xl`} />
            </HeaderButton>
          )}

          {currentSlideIndex < media.length - 1 && (
            <HeaderButton
              className={`absolute right-2 top-1/2 z-[100] flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 hover:bg-black/40 group-hover:opacity-100 lg:right-4 lg:size-10`}
              onClick={() => {
                emblaApi?.scrollNext()
              }}
            >
              <i className={`i-mingcute-right-line text-lg lg:text-xl`} />
            </HeaderButton>
          )}
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
    onZoomChange?: (isZoomed: boolean) => void
  }
> = ({ src, fallbackUrl, containerClassName, onZoomChange }) => {
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
          onZoomChange={onZoomChange}
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
