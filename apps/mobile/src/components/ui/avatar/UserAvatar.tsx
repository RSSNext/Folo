import { cn } from "@follow/utils/src/utils"
import { Text, View } from "react-native"

import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"

import { ProxiedImage } from "../image/ProxiedImage"

interface UserAvatarProps {
  image?: string | null
  size?: number
  name?: string | null
  className?: string
  color?: string
}
export const UserAvatar = ({ image, size = 24, name, className, color }: UserAvatarProps) => {
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
          <Text className="text-secondary-label text-xs">{name.slice(0, 2)}</Text>
        ) : (
          <User3CuteReIcon width={size} height={size} color={color} />
        )}
      </View>
    )
  }

  return (
    <ProxiedImage
      source={{ uri: image }}
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
      resizeMode="cover"
      proxy={{
        width: size,
        height: size,
      }}
    />
  )
}
