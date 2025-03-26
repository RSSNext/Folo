import type { ImageErrorEventData, ImageProps as ExpoImageProps } from "expo-image"
import { Image as ExpoImage } from "expo-image"
import { forwardRef, useCallback, useMemo, useState } from "react"

import { getAllSources } from "./utils"

export type ImageProps = Omit<ExpoImageProps, "source"> & {
  proxy?: {
    width?: number
    height?: number
  }
  source?: {
    uri: string
    headers?: Record<string, string>
  }
  blurhash?: string
  aspectRatio?: number
}

export const Image = forwardRef<ExpoImage, ImageProps>(
  ({ proxy, source, blurhash, aspectRatio, ...rest }, ref) => {
    const [safeSource, proxiesSafeSource] = useMemo(
      () => getAllSources(source, proxy),
      [source, proxy],
    )

    const [isError, setIsError] = useState(false)
    const onError = useCallback(
      (e: ImageErrorEventData) => {
        if (isError) {
          rest.onError?.(e)
        } else {
          setIsError(true)
        }
      },
      [isError, rest],
    )

    if (!source?.uri) {
      return null
    }

    return (
      <ExpoImage
        source={isError ? safeSource : proxiesSafeSource}
        onError={onError}
        placeholder={{
          blurhash,
          ...(typeof rest.placeholder === "object" && { ...rest.placeholder }),
        }}
        style={{
          aspectRatio,
          ...(typeof rest.style === "object" && { ...rest.style }),
        }}
        recyclingKey={source?.uri}
        {...rest}
        ref={ref}
      />
    )
  },
)
