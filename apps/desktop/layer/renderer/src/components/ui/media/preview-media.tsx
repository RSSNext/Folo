import { Spring } from "@follow/components/constants/spring.js"
import { ActionButton, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { useMeasure } from "@follow/hooks"
import { IN_ELECTRON } from "@follow/shared/constants"
import type { MediaModel } from "@follow/shared/hono"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import useEmblaCarousel from "embla-carousel-react"
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"
import type { FC } from "react"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { Blurhash } from "react-blurhash"
import { useTranslation } from "react-i18next"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import { useWindowSize } from "usehooks-ts"

import { m } from "~/components/common/Motion"
import { COPY_MAP } from "~/constants"
import { ipcServices } from "~/lib/client"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"

import { FixedModalCloseButton } from "../modal/components/close"
import { useCurrentModal } from "../modal/stacked/hooks"
import { VideoPlayer } from "./VideoPlayer"

const Wrapper: Component<{
  src: string
  showActions?: boolean
  sideContent?: React.ReactNode
}> = ({ children, src, showActions, sideContent }) => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation(["shortcuts", "common"])

  const containerRef = useRef<HTMLDivElement>(null)

  const [showActionOverlay, setShowActionOverlay] = useState(false)
  useEffect(() => {
    if (!containerRef.current || !showActions) {
      return
    }
    const $container = containerRef.current
    const handleMouseMove = (e: MouseEvent) => {
      const atBottom = e.clientY / $container.clientHeight > 0.6
      if (atBottom) {
        setShowActionOverlay(true)
      } else {
        setShowActionOverlay(false)
      }
    }
    const outOfContainer = () => {
      setShowActionOverlay(false)
    }
    $container.addEventListener("mousemove", handleMouseMove)
    $container.addEventListener("mouseleave", outOfContainer)
    return () => {
      $container.removeEventListener("mousemove", handleMouseMove)
      $container.removeEventListener("mouseleave", outOfContainer)
    }
  }, [sideContent, showActions])

  return (
    <div
      className="center relative size-full py-12 lg:px-20 lg:pb-8 lg:pt-10"
      onClick={dismiss}
      ref={containerRef}
    >
      <m.div
        onFocusCapture={stopPropagation}
        initial={true}
        exit={{
          opacity: 0,
        }}
        className="safe-inset-top-4 fixed right-4 flex items-center"
      >
        <FixedModalCloseButton onClick={dismiss} />
      </m.div>

      <m.div
        className="center flex size-full"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={Spring.presets.microRebound}
      >
        <div
          className={cn(
            "relative flex h-full w-auto overflow-hidden",
            sideContent
              ? "bg-sidebar min-w-96 items-center justify-center rounded-l-xl"
              : "rounded-xl",
          )}
        >
          {children}
          <RootPortal to={sideContent ? null : undefined}>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[99] overflow-hidden">
              <div
                style={{
                  opacity: showActionOverlay ? 1 : 0,
                  transform: showActionOverlay ? "translateY(0)" : "translateY(50px)",
                }}
                className={cn(
                  "flex justify-end gap-3 p-2 text-white/70 duration-200 [&_button]:hover:text-white",
                  "hover:!transform-none hover:!opacity-100",

                  // sideContent ? "rounded-bl-xl" : "rounded-xl",
                  "bg-black/50",
                )}
                onClick={stopPropagation}
              >
                {showActions && (
                  <Fragment>
                    {IN_ELECTRON && (
                      <ActionButton
                        tooltip={t("common:words.download")}
                        onClick={() => {
                          ipcServices?.app.download(src)
                        }}
                      >
                        <i className="i-mgc-download-2-cute-re" />
                      </ActionButton>
                    )}
                    <ActionButton
                      tooltip={t(COPY_MAP.OpenInBrowser())}
                      onClick={() => {
                        window.open(src)
                      }}
                    >
                      <i className="i-mgc-external-link-cute-re" />
                    </ActionButton>
                  </Fragment>
                )}
              </div>
            </div>
          </RootPortal>
        </div>
        {!!sideContent && (
          <div
            className="bg-theme-background box-border flex h-full w-[400px] min-w-0 shrink-0 flex-col rounded-r-xl px-2 pt-1"
            onClick={stopPropagation}
          >
            {sideContent}
          </div>
        )}
      </m.div>
    </div>
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
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActions(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

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
      <Wrapper src={src} showActions={!isVideo} sideContent={children}>
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
            containerClassName="w-auto"
            className="h-full w-auto object-contain"
            alt="cover"
            src={src}
            height={media[0]!.height}
            width={media[0]!.width}
            blurhash={media[0]!.blurhash}
            haveSideContent={!!children}
          />
        )}
      </Wrapper>
    )
  }
  const isVideo = currentMedia!.type === "video"
  return (
    <Wrapper src={currentMedia!.url} showActions={!isVideo} sideContent={children}>
      <div className="size-full overflow-hidden" ref={emblaRef}>
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
                  haveSideContent={!!children}
                />
              )}
            </div>
          ))}
        </div>

        {showActions && (
          <div tabIndex={-1} onClick={stopPropagation}>
            <m.button
              initial={{ opacity: 0, transform: "translate3d(-20px, 0, 0) scale(0.94)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
              whileTap={{ transform: "translate3d(0, 0, 0) scale(0.9)" }}
              onClick={() => emblaApi?.scrollPrev()}
              type="button"
              className="center absolute left-2 top-1/2 z-[99] size-8 -translate-y-1/2 rounded-full border border-white/20 bg-neutral-900/80 text-white backdrop-blur duration-200 hover:bg-neutral-900"
            >
              <i className="i-mingcute-arrow-left-line" />
            </m.button>

            <m.button
              initial={{ opacity: 0, transform: "translate3d(20px, 0, 0) scale(0.94)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
              whileTap={{ transform: "translate3d(0, 0, 0) scale(0.9)" }}
              onClick={() => emblaApi?.scrollNext()}
              type="button"
              className="center absolute right-2 top-1/2 z-[99] size-8 -translate-y-1/2 rounded-full border border-white/20 bg-neutral-900/80 text-white backdrop-blur duration-200 hover:bg-neutral-900"
            >
              <i className="i-mingcute-arrow-right-line" />
            </m.button>
          </div>
        )}

        {showActions && (
          <div>
            <div
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-6 absolute left-4 text-sm tabular-nums text-white/60",
                isVideo ? "bottom-12" : "bottom-4",
              )}
            >
              {currentSlideIndex + 1} / {media.length}
            </div>
            <div
              tabIndex={-1}
              onClick={stopPropagation}
              className={cn(
                "center animate-in fade-in-0 slide-in-from-bottom-6 absolute left-1/2 z-[99] h-6 -translate-x-1/2 gap-2 rounded-full bg-neutral-700/90 px-4 duration-200",
                isVideo ? "bottom-12" : "bottom-4",
              )}
            >
              {Array.from({ length: media.length })
                .fill(0)
                .map((_, index) => (
                  <button
                    onClick={() => {
                      emblaApi?.scrollTo(index)
                    }}
                    type="button"
                    key={index}
                    className={cn(
                      "inline-block size-[6px] rounded-full",
                      currentSlideIndex === index ? "bg-white" : "bg-white/20",
                    )}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

function parseNumber(value: string | number | undefined) {
  return typeof value === "string" ? Number.parseInt(value) : value
}

const FallbackableImage: FC<
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string
    containerClassName?: string
    fallbackUrl?: string
    blurhash?: string
    haveSideContent?: boolean
  }
> = ({ src, onError, fallbackUrl, containerClassName, blurhash, haveSideContent, ...props }) => {
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

  const height = parseNumber(props.height)
  const width = parseNumber(props.width)

  const { height: windowHeight, width: windowWidth } = useWindowSize()
  // px-20 pb-8 pt-10
  // wrapper side content w-[400px]
  const maxContainerHeight = windowHeight - 32 - 40
  const maxContainerWidth = windowWidth - 80 - 80 - (haveSideContent ? 400 : 0)

  const [zoomingState, setZoomingState] = useState<"zoom-in" | "zoom-out" | null>(null)
  const [zoomContainerWidth, setZoomContainerWidth] = useState(0)

  const wrapperClass = cn("relative !max-h-full", width && height && width <= height && "!h-full")
  const wrapperStyle: React.CSSProperties = {
    width:
      width && height && width > height
        ? `${Math.min(maxContainerHeight * (width / height), width)}px`
        : undefined,
    maxWidth: width && height && width > height ? `${maxContainerWidth}px` : undefined,
  }

  const [ref, { width: imgWidth }] = useMeasure()

  return (
    <div className={cn("center flex size-full flex-col", containerClassName)}>
      {!isAllError && (
        <TransformWrapper
          wheel={{ smoothStep: 0.008 }}
          onZoom={(e) => {
            if (e.state.scale !== 1) {
              setZoomingState(e.state.scale > 1 ? "zoom-in" : "zoom-out")
            } else {
              setZoomingState(null)
            }
            setZoomContainerWidth(Math.min(maxContainerWidth, e.state.scale * imgWidth))
          }}
        >
          <TransformComponent
            wrapperClass={wrapperClass}
            wrapperStyle={{
              ...wrapperStyle,
              minWidth:
                zoomingState === "zoom-in" && !haveSideContent
                  ? `${zoomContainerWidth}px`
                  : undefined,
              height: zoomingState === "zoom-in" ? "100%" : undefined,
            }}
            contentClass={wrapperClass}
            contentStyle={wrapperStyle}
            wrapperProps={{
              onClick: stopPropagation,
            }}
          >
            <img
              ref={ref}
              data-blurhash={blurhash}
              src={currentSrc}
              onLoad={() => setIsLoading(false)}
              onError={handleError}
              height={props.height}
              width={props.width}
              {...props}
              className={cn(
                // See https://github.com/BetterTyped/react-zoom-pan-pinch/issues/135#issuecomment-683463453
                // See also https://github.com/RSSNext/Folo/issues/3183
                "!pointer-events-auto mx-auto transition-opacity duration-700",
                isLoading ? "opacity-0" : "opacity-100",
                props.className,
              )}
              style={{
                maxHeight: `${maxContainerHeight}px`,
                ...props.style,
              }}
            />
            <div
              className={cn(
                "center pointer-events-none absolute inset-0 size-full transition-opacity duration-700",
                isLoading ? "opacity-100" : "opacity-0",
              )}
            >
              {blurhash ? (
                <Blurhash
                  hash={blurhash}
                  resolutionX={32}
                  resolutionY={32}
                  className="!size-full"
                />
              ) : isLoading ? (
                <i className="i-mgc-loading-3-cute-re size-8 animate-spin text-white/80" />
              ) : null}
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}
      {isAllError && (
        <div
          className="center pointer-events-none absolute inset-0 flex-col gap-6"
          onClick={stopPropagation}
          tabIndex={-1}
        >
          <i className="i-mgc-close-cute-re text-[60px] text-red-400" />

          <span>Failed to load image</span>
          <div className="center gap-4">
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
        <div className="mt-4 text-center text-xs text-white/60">
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
