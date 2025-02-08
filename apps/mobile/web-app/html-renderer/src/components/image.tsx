import clsx from "clsx"
import { useAtomValue } from "jotai"
import { useContext, useMemo, useRef, useState } from "react"
import { Blurhash } from "react-blurhash"

import type { HTMLProps } from "~/HTML"

import { entryAtom } from "../../atoms"
import { calculateDimensions } from "../../hooks/useCalculateNaturalSize"
import { MarkdownRenderContainerRefContext } from "./__internal/ctx"

export const MarkdownImage = (props: HTMLProps<"img">) => {
  const { src, ...rest } = props

  const imageRef = useRef<HTMLImageElement>(null)

  const entry = useAtomValue(entryAtom)

  const [isLoading, setIsLoading] = useState(true)
  const ref = useContext(MarkdownRenderContainerRefContext)
  const image = entry?.media.find((media) => media.url === src)
  const { height: scaleHeight, width: scaleWidth } = useMemo(
    () =>
      calculateDimensions({
        width: image?.width ?? 0,
        height: image?.height ?? 0,
        max: {
          width: ref?.clientWidth ?? 0,
          height: window.innerHeight,
        },
      }),
    [image?.width, image?.height, ref?.clientWidth],
  )

  return (
    <button
      type="button"
      className="relative -mx-3 overflow-hidden bg-gray-300 dark:bg-neutral-800"
      style={{
        width: scaleWidth || undefined,
        height: scaleHeight || undefined,
      }}
      onClick={() => {
        const $image = imageRef.current
        if (!$image) return
        const canvas = document.createElement("canvas")
        canvas.width = $image.naturalWidth
        canvas.height = $image.naturalHeight

        // Draw image on canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage($image, 0, 0)

        canvas.toBlob((blob) => {
          if (!blob) return
          const reader = new FileReader()
          // eslint-disable-next-line unicorn/prefer-blob-reading-methods
          reader.readAsArrayBuffer(blob)

          reader.onloadend = () => {
            const uint8Array = new Uint8Array(reader.result as ArrayBuffer)
            bridge.previewImage({
              images: [uint8Array],
              index: 0,
            })
          }
        }, "image/png")
      }}
    >
      {image?.blurhash && (
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
          width: scaleWidth,
          height: scaleHeight,
        }}
        loading="lazy"
        className={clsx(
          "absolute inset-0 !my-0 transition-opacity duration-500",
          isLoading && "opacity-0",
        )}
        crossOrigin="anonymous"
        src={src}
        ref={imageRef}
      />
    </button>
  )
}
