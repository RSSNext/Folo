import type {
  ImageErrorEventData,
  ImageLoadEventData,
  ImageProps as ExpoImageProps,
} from "expo-image"
import { Image as ExpoImage } from "expo-image"
import { useCallback, useMemo, useState } from "react"
import { useColor } from "react-native-uikit-colors"

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
  hideOnError?: boolean
}

export const Image = ({
  ref,
  proxy,
  source,
  blurhash,
  aspectRatio,
  hideOnError,
  ...rest
}: ImageProps & { ref?: React.Ref<ExpoImage | null> }) => {
  const [safeSource, proxiesSafeSource] = useMemo(
    () => getAllSources(source, proxy),
    [source, proxy],
  )

  const [isFallback, setIsFallback] = useState(false)
  const [isError, setIsError] = useState(false)
  const onError = useCallback(
    (e: ImageErrorEventData) => {
      if (
        isFallback ||
        e.error === "Downloaded image has 0 pixels" ||
        safeSource?.uri?.endsWith(".svg")
      ) {
        setIsError(true)
        rest.onError?.(e)
      } else {
        setIsFallback(true)
      }
    },
    [isFallback, rest, safeSource?.uri],
  )

  const [isLoading, setIsLoading] = useState(true)
  const onLoad = useCallback(
    (e: ImageLoadEventData) => {
      setIsLoading(false)
      rest.onLoad?.(e)
    },
    [rest],
  )

  const backgroundColor = useColor("secondarySystemBackground")

  if (!source?.uri) {
    return null
  }

  if (hideOnError && isError) {
    return null
  }

  return (
    <ExpoImage
      recyclingKey={source?.uri}
      {...rest}
      source={isFallback ? safeSource : proxiesSafeSource}
      onError={onError}
      onLoad={onLoad}
      placeholder={{
        blurhash,
        ...(typeof rest.placeholder === "object" && { ...rest.placeholder }),
      }}
      placeholderContentFit="cover"
      style={[
        {
          aspectRatio,
          ...(typeof rest.style === "object" && { ...rest.style }),
          ...((isLoading || isError) && { backgroundColor }),
        },
        rest.style,
      ]}
      ref={ref}
    />
  )
}
