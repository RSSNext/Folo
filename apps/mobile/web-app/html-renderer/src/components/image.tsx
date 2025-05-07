import clsx from "clsx"
import { useAtomValue } from "jotai"
import { useMemo, useRef, useState } from "react"
import { Blurhash } from "react-blurhash"

import { entryAtom } from "~/atoms"
import { useWrappedElementSize } from "~/common/WrappedElementProvider"
import type { HTMLProps } from "~/HTML"

import { calculateDimensions } from "./__internal/calculateDimensions"

export const MarkdownImage = (props: HTMLProps<"img">) => {
  const { src, ...rest } = props

  const imageRef = useRef<HTMLImageElement>(null)

  const entry = useAtomValue(entryAtom)

  const [isLoading, setIsLoading] = useState(true)

  const image = entry?.media?.find((media) => media.url === src)

  const { w } = useWrappedElementSize()
  const { height: scaleHeight, width: scaleWidth } = useMemo(
    () =>
      calculateDimensions({
        width: image?.width,
        height: image?.height,
        max: {
          width: w,
          height: Infinity,
        },
      }),
    [image?.width, image?.height, w],
  )

  return (
    <button
      type="button"
      className="relative -mx-5 overflow-hidden bg-gray-300 dark:bg-neutral-800"
      style={{
        width: scaleWidth || undefined,
        height: scaleHeight || undefined,
      }}
      data-image-height={image?.height}
      data-image-width={image?.width}
      data-container-width={w}
      onClick={() => {
        if (!src) return
        bridge.previewImage({
          imageUrls: [src],
          index: 0,
        })
      }}
    >
      {image?.blurhash && scaleWidth && scaleHeight && (
        <Blurhash
          hash={image.blurhash}
          width={scaleWidth}
          height={scaleHeight}
          resolutionX={32}
          resolutionY={32}
          punch={1}
          className="pointer-events-none absolute inset-0 z-0"
        />
      )}
      <img
        {...rest}
        onLoad={() => setIsLoading(false)}
        style={{
          width: scaleWidth || undefined,
          height: scaleHeight || undefined,
        }}
        loading="lazy"
        className={clsx(
          "!my-0 transition-opacity duration-500",
          isLoading && "opacity-0",
          scaleWidth && scaleHeight && "absolute inset-0",
        )}
        crossOrigin="anonymous"
        src={src}
        ref={imageRef}
      />
    </button>
  )
}
