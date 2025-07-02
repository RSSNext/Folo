import { useImageColors } from "@follow/store/image/hooks"
import { useUserById } from "@follow/store/user/hooks"
import { cn, getLuminance } from "@follow/utils"
import { LinearGradient } from "expo-linear-gradient"
import type { FC } from "react"
import { useMemo } from "react"
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import ReAnimated, { FadeIn, FadeOut, interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { DiscordCuteFiIcon } from "@/src/icons/discord_cute_fi"
import { FacebookCuteFiIcon } from "@/src/icons/facebook_cute_fi"
import { GithubCuteFiIcon } from "@/src/icons/github_cute_fi"
import { InstagramCuteFiIcon } from "@/src/icons/instagram_cute_fi"
import { LinkCuteReIcon } from "@/src/icons/link_cute_re"
import { TwitterCuteFiIcon } from "@/src/icons/twitter_cute_fi"
import { WebCuteReIcon } from "@/src/icons/web_cute_re"
import { YoutubeCuteFiIcon } from "@/src/icons/youtube_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { LoginScreen } from "@/src/screens/(modal)/LoginScreen"
import { usePrefetchImageColors } from "@/src/store/image/hooks"

const defaultGradientColors = ["#000", "#100", "#200"]

const PlatformInfoMap: Record<
  string,
  { component: FC<any>; color: { light: string; dark: string } }
> = {
  github: { component: GithubCuteFiIcon, color: { light: "#181717", dark: "#FFFFFF" } },
  twitter: { component: TwitterCuteFiIcon, color: { light: "#1DA1F2", dark: "#1DA1F2" } },
  youtube: { component: YoutubeCuteFiIcon, color: { light: "#FF0000", dark: "#FF0000" } },
  discord: { component: DiscordCuteFiIcon, color: { light: "#5865F2", dark: "#5865F2" } },
  instagram: { component: InstagramCuteFiIcon, color: { light: "#C13584", dark: "#C13584" } },
  facebook: { component: FacebookCuteFiIcon, color: { light: "#1877F2", dark: "#1877F2" } },
}

export const UserHeaderBanner = ({
  scrollY,
  userId,
}: {
  scrollY: SharedValue<number>
  userId?: string
}) => {
  const bgColor = useColor("systemGroupedBackground")
  const avatarIconColor = useColor("secondaryLabel")

  const user = useUserById(userId)
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

  const socialLinks = useMemo(() => {
    if (!user?.socialLinks) {
      return []
    }
    return Object.entries(user.socialLinks)
      .filter(([, value]) => !!value)
      .map(([platform, link]) => ({ platform, link: link! }))
  }, [user?.socialLinks])

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

    return {
      transform: [{ scale: scaleValue }],
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
      transform: [{ scale: avatarScale }, { translateY: avatarTranslateY }],
    }
  })

  const navigation = useNavigation()

  return (
    <View
      className="relative items-center justify-center pt-[22px]"
      style={{ marginTop: -insets.top - 22 }}
    >
      <ReAnimated.View entering={FadeIn} className="absolute inset-0" style={styles}>
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
      <View className="items-center px-4 pb-[24px]" style={{ paddingTop: insets.top }}>
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
        {user?.bio ? (
          <Text
            numberOfLines={3}
            className={cn(
              "mt-2 px-8 text-center",
              gradientLight ? "text-black/80" : "text-white/80",
            )}
          >
            {user.bio}
          </Text>
        ) : null}
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 px-8">
          {user?.website && (
            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={() => user.website && Linking.openURL(user.website)}
            >
              <WebCuteReIcon
                height={16}
                width={16}
                color={gradientLight ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)"}
              />
              <Text
                className={cn("font-semibold", gradientLight ? "text-black/70" : "text-white/70")}
              >
                {user.website.replace(/^(https?:\/\/)?(www\.)?/, "")}
              </Text>
            </TouchableOpacity>
          )}
          {socialLinks.map(({ platform, link }) => {
            const platformInfo = PlatformInfoMap[platform as keyof typeof PlatformInfoMap]
            const IconComponent = platformInfo ? platformInfo.component : LinkCuteReIcon
            const color = platformInfo
              ? gradientLight
                ? platformInfo.color.light
                : platformInfo.color.dark
              : gradientLight
                ? "rgba(0,0,0,0.8)"
                : "rgba(255,255,255,0.8)"

            return (
              <TouchableOpacity key={platform} onPress={() => Linking.openURL(link)}>
                <IconComponent height={22} width={22} color={color} />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}
