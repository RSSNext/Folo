import { UserRole } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { Text, View } from "react-native"

import { PowerIcon } from "@/src/icons/power"
import { User4CuteFiIcon } from "@/src/icons/user_4_cute_fi"
import { accentColor } from "@/src/theme/colors"

import { Galeria } from "../image/galeria"
import { Image } from "../image/Image"

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
        {role && role !== UserRole.Free && role !== UserRole.Trial && (
          <View
            className="absolute bottom-0 right-0 rounded-full"
            style={{ width: size / 3, height: size / 3 }}
          >
            <PowerIcon color={accentColor} width={size / 3} height={size / 3} />
          </View>
        )}
      </View>
    )
  }

  const imageContent = (
    <Image
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
    <Galeria urls={[image]}>
      <Galeria.Image index={0}>{imageContent}</Galeria.Image>
    </Galeria>
  ) : (
    imageContent
  )
}
