import { cn } from "@follow/utils/utils"
import type { Image as ExpoImage } from "expo-image"
import { useCallback } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { measure, runOnJS, runOnUI, useAnimatedRef } from "react-native-reanimated"

import { User4CuteFiIcon } from "@/src/icons/user_4_cute_fi"

import { useLightboxControls } from "../../lightbox/lightboxState"
import { Image } from "../image/Image"

interface UserAvatarProps {
  image?: string | null
  size?: number
  name?: string | null
  className?: string
  color?: string

  preview?: boolean
}

export const UserAvatar = ({
  image,
  size = 24,
  name,
  className,
  color,
  preview = true,
}: UserAvatarProps) => {
  const { openLightbox } = useLightboxControls()
  const aviRef = useAnimatedRef<ExpoImage>()

  const onPreview = useCallback(() => {
    runOnUI(() => {
      "worklet"
      if (!image) {
        return
      }
      const rect = measure(aviRef)
      runOnJS(openLightbox)({
        images: [
          {
            uri: image,
            thumbUri: image,
            thumbDimensions: null,
            thumbRect: rect,
            dimensions: rect
              ? {
                  height: rect.height,
                  width: rect.width,
                }
              : null,
            type: "image",
          },
        ],
        index: 0,
      })
    })()
  }, [aviRef, image, openLightbox])

  if (!image) {
    return (
      <View
        className={cn(
          "items-center justify-center rounded-full",
          name && "bg-secondary-system-background",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {name ? (
          <Text
            className="text-secondary-label p-2 text-center uppercase"
            style={{ fontSize: size / 3 }}
            adjustsFontSizeToFit
          >
            {name.slice(0, 2)}
          </Text>
        ) : (
          <User4CuteFiIcon width={size} height={size} color={color} />
        )}
      </View>
    )
  }

  const imageContent = (
    <Image
      ref={aviRef}
      source={{ uri: image }}
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
      proxy={{
        width: size,
        height: size,
      }}
    />
  )

  return preview ? (
    <TouchableOpacity onPress={onPreview}>{imageContent}</TouchableOpacity>
  ) : (
    imageContent
  )
}
