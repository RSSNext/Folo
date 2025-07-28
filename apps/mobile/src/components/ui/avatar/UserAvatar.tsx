import { UserRole } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import type { Image as ExpoImage } from "expo-image"
import { useCallback } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { measure, runOnJS, runOnUI, useAnimatedRef } from "react-native-reanimated"

import { PowerIcon } from "@/src/icons/power"
import { User4CuteFiIcon } from "@/src/icons/user_4_cute_fi"
import { accentColor } from "@/src/theme/colors"

import { Image } from "../image/Image"
import { useLightboxControls } from "../lightbox/lightboxState"

interface UserAvatarProps {
  image?: string | null
  size?: number
  name?: string | null
  className?: string
  color?: string
  preview?: boolean
  role?: UserRole | null
}
export const UserAvatar = ({
  image,
  size = 24,
  name,
  className,
  color,
  preview = true,
  role,
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
  const avatarBadge =
    role && role !== UserRole.Free && role !== UserRole.Trial ? (
      <View
        className="absolute bottom-0 right-0 rounded-full"
        style={{
          width: size / 3,
          height: size / 3,
        }}
      >
        <PowerIcon color={accentColor} width={size / 3} height={size / 3} />
      </View>
    ) : null
  if (!image) {
    return (
      <View
        className={cn(
          "items-center justify-center rounded-full",
          name && "bg-secondary-system-background",
          className,
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {name ? (
          <Text
            allowFontScaling={false}
            className="text-secondary-label p-2 text-center uppercase"
            style={{
              fontSize: size / 3,
            }}
            adjustsFontSizeToFit
          >
            {name.slice(0, 2)}
          </Text>
        ) : (
          <User4CuteFiIcon width={size} height={size} color={color} />
        )}
        {avatarBadge}
      </View>
    )
  }
  const imageContent = (
    <View className="relative">
      <Image
        ref={aviRef}
        source={{
          uri: image,
        }}
        className={cn("rounded-full", className)}
        style={{
          width: size,
          height: size,
        }}
        proxy={{
          width: size,
          height: size,
        }}
      />
      {avatarBadge}
    </View>
  )
  return preview ? (
    <TouchableOpacity onPress={onPreview}>{imageContent}</TouchableOpacity>
  ) : (
    imageContent
  )
}
