import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import * as Avatar from "@radix-ui/react-avatar"
import type { MouseEvent, PropsWithChildren } from "react"
import { useMemo } from "react"
import { Blurhash } from "react-blurhash"

type LazyImageProps = PropsWithChildren<{
  src?: string
  blurhash?: string

  className?: string

  height?: number
  width?: number

  proxy?: {
    width: number
    height: number
  }
  onClick?: (e: MouseEvent) => void
}>
export const LazyImage = ({
  ref,
  src,
  blurhash,
  className,
  height,
  width,
  proxy,
  onClick,
}: LazyImageProps & { ref?: React.Ref<HTMLImageElement | null> }) => {
  const nextSrc = useMemo(() => {
    if (!src) return src

    if (!proxy?.height && !proxy?.width) {
      return src
    }
    return getImageProxyUrl({
      url: src,
      width: proxy?.width,
      height: proxy?.height,
    })
  }, [src, proxy?.height, proxy?.width])
  return (
    <Avatar.Root className="relative">
      <Avatar.Image
        ref={ref}
        src={nextSrc}
        height={height}
        width={width}
        className={cn("size-full object-cover", className)}
        onClick={onClick}
        tabIndex={1}
      />
      <Avatar.Fallback asChild>
        <div
          className={cn(
            "center size-full max-w-full",

            !blurhash && "bg-theme-inactive/50",
            className,
          )}
          style={{
            aspectRatio: height && width ? height / width : undefined,
            width,
          }}
        >
          {blurhash && (
            <Blurhash hash={blurhash} resolutionX={32} resolutionY={32} className="!size-full" />
          )}
        </div>
      </Avatar.Fallback>
    </Avatar.Root>
  )
}
