import { useImageColors, usePrefetchImageColors } from "@follow/store/image/hooks"
import { useUser } from "@follow/store/user/hooks"
import { cn, getLuminance } from "@follow/utils"
import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import ReAnimated, { FadeIn, FadeOut, interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"

const defaultGradientColors = ["#000", "#100", "#200"]

export const UserHeaderBanner = ({
  scrollY,
  userId,
}: {
  scrollY: SharedValue<number>
  userId?: string
}) => {
  const bgColor = useColor("systemGroupedBackground")
  const avatarIconColor = useColor("secondaryLabel")

  const user = useUser(userId)
  usePrefetchImageColors(user?.image)
  const insets = useSafeAreaInsets()

  const MAX_PULL = 100
  const SCALE_FACTOR = 1.8

  const imageColors = useImageColors(user?.image)
  const gradientColors = useMemo(() => {
    if (!imageColors || imageColors.platform === "web")
      return user ? defaultGradientColors : [bgColor, bgColor, bgColor]
    if (imageColors.platform === "android") {
      return [
        imageColors.dominant,
        imageColors.average || imageColors.vibrant,
        imageColors.vibrant || imageColors.dominant,
      ]
    }
    return [imageColors.primary, imageColors.secondary, imageColors.background]
  }, [bgColor, imageColors, user])

  const gradientLight = useMemo(() => {
    if (!imageColors) return false
    if (imageColors.platform === "web") return false
    const dominantLuminance = getLuminance(
      imageColors.platform === "android" ? imageColors.dominant : imageColors.primary,
    )
    return dominantLuminance > 0.5
  }, [imageColors])

  const styles = useAnimatedStyle(() => {
    const scaleValue = interpolate(scrollY.value, [-MAX_PULL, 0], [SCALE_FACTOR, 1], {
      extrapolateLeft: "extend",
      extrapolateRight: "clamp",
    })

    if (!gradientColors) return {}
    return {
      transform: [{ scale: scaleValue }],
      height: 250,
    }
  })

  // Add animated style for avatar
  const avatarStyles = useAnimatedStyle(() => {
    // Scale avatar when pulling down
    const avatarScale = interpolate(scrollY.value, [-MAX_PULL, 0], [1.3, 1], {
      extrapolateLeft: "extend",
      extrapolateRight: "clamp",
    })

    // Move avatar up when pulling down
    const avatarTranslateY = interpolate(scrollY.value, [-MAX_PULL, 0], [-20, 0], {
      extrapolateLeft: "extend",
      extrapolateRight: "clamp",
    })

    return {
      marginTop: insets.top,
      transform: [{ scale: avatarScale }, { translateY: avatarTranslateY }],
    }
  })

  const navigation = useNavigation()

  return (
    <View
      className="relative h-[200px] items-center justify-center"
      style={{ marginTop: -insets.top }}
    >
      <ReAnimated.View entering={FadeIn} className="absolute inset-x-0 bottom-0" style={styles}>
        <LinearGradient
          colors={defaultGradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {gradientColors && (
          <ReAnimated.View
            style={StyleSheet.absoluteFillObject}
            entering={FadeIn}
            exiting={FadeOut}
          >
            <LinearGradient
              colors={gradientColors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </ReAnimated.View>
        )}
      </ReAnimated.View>
      <ReAnimated.View
        style={avatarStyles}
        className="bg-system-background overflow-hidden rounded-full"
      >
        <UserAvatar
          image={user?.image}
          name={user?.name}
          size={60}
          className={!user?.name ? "bg-system-grouped-background" : ""}
          color={avatarIconColor}
        />
      </ReAnimated.View>

      <View className="mt-2 items-center">
        {user?.name ? (
          <Text
            numberOfLines={1}
            className={cn(
              "px-8 text-2xl font-bold",
              gradientLight ? "text-black" : "text-white/95",
            )}
          >
            {user.name}
          </Text>
        ) : (
          <Text className="text-text text-2xl font-bold">Folo Account</Text>
        )}

        {user?.handle ? (
          <Text className={cn(gradientLight ? "text-black/70" : "text-white/70")}>
            @{user.handle}
          </Text>
        ) : !user ? (
          <TouchableOpacity
            className="mx-auto"
            onPress={() => navigation.presentControllerView(LoginScreen)}
          >
            <Text className="text-accent m-[6] text-[16px]">Sign in to your account</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}
