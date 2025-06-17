import type { MediaModel } from "@follow/shared/hono"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import useEmblaCarousel from "embla-carousel-react"
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"
import { uniqBy } from "es-toolkit/compat"
import { useCallback, useRef } from "react"

import { Media } from "~/components/ui/media/Media"

const defaultProxySize = {
  width: 600,
  height: 0,
}

export function SwipeMedia({
  media,
  className,
  imgClassName,
  onPreview,
  proxySize = defaultProxySize,
}: {
  media?: MediaModel[] | null
  className?: string
  imgClassName?: string
  onPreview?: (media: MediaModel[], index?: number) => void
  proxySize?: {
    width: number
    height: number
  }
}) {
  const uniqMedia = media ? uniqBy(media, "url") : []

  const hoverRef = useRef<HTMLDivElement>(null)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [WheelGesturesPlugin()])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (!media) return null

  return (
    <div
      ref={hoverRef}
      className={cn(
        "relative flex w-full items-center overflow-hidden",

        className,
      )}
    >
      {uniqMedia?.length ? (
        <div ref={emblaRef} className="size-full overflow-hidden">
          <div className="flex size-full">
            {uniqMedia?.slice(0, 5).map((med, i) => (
              <div className="mr-2 size-full flex-none" key={med.url}>
                <Media
                  className={cn(imgClassName, "size-full rounded-none")}
                  mediaContainerClassName="object-cover"
                  alt="cover"
                  cacheDimensions={med.type === "photo"}
                  src={med.url}
                  type={med.type}
                  previewImageUrl={med.preview_image_url}
                  loading="lazy"
                  proxy={proxySize}
                  blurhash={med.blurhash}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview?.(uniqMedia, i)
                  }}
                  showFallback={true}
                  fitContent
                />
              </div>
            ))}
          </div>
          {emblaApi?.canScrollPrev() && (
            <button
              type="button"
              className="center absolute left-2 top-1/2 size-6 -translate-y-1/2 rounded-full bg-gray-800 text-white opacity-0 duration-200 group-hover:opacity-100"
              onClick={scrollPrev}
              onDoubleClick={stopPropagation}
            >
              <i className="i-mingcute-arrow-left-line" />
            </button>
          )}
          {emblaApi?.canScrollNext() && (
            <button
              type="button"
              className="center absolute right-2 top-1/2 size-6 -translate-y-1/2 rounded-full bg-gray-800 text-white opacity-0 duration-200 group-hover:opacity-100"
              onClick={scrollNext}
              onDoubleClick={stopPropagation}
            >
              <i className="i-mingcute-arrow-right-line" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-video w-full items-center overflow-hidden rounded-t-2xl border-b">
          <div className="flex size-full items-center justify-center p-3 text-center sm:transition-transform sm:duration-500 sm:ease-in-out sm:group-hover:scale-105">
            <div className="text-xl font-extrabold text-zinc-600" />
          </div>
        </div>
      )}
    </div>
  )
}
