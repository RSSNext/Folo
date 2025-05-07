import { cn } from "@follow/utils"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"

import { Search3CuteReIcon } from "@/src/icons/search_3_cute_re"
import { Shuffle2CuteReIcon } from "@/src/icons/shuffle_2_cute_re"
import { useSubscription } from "@/src/store/subscription/hooks"
import { subscriptionSyncService } from "@/src/store/subscription/store"
import { accentColor } from "@/src/theme/colors"

import type { PresetFeedConfig } from "./preset"
import { getPresetFeeds } from "./preset"
import { OnboardingSectionScreenContainer } from "./shared"

export const StepInterests = () => {
  const { t, i18n } = useTranslation()
  const isEnglishUser = i18n.language === "en"
  const [displayFeeds, setDisplayFeeds] = useState<PresetFeedConfig[]>(
    getPresetFeeds(isEnglishUser).slice(0, 7),
  )

  const shuffleFeeds = useCallback(() => {
    const presetFeeds = getPresetFeeds(isEnglishUser)
    const shuffled = [...presetFeeds].sort(() => Math.random() - 0.5).slice(0, 7)
    setDisplayFeeds(shuffled)
  }, [isEnglishUser])

  return (
    <OnboardingSectionScreenContainer>
      <View className="mb-10 flex items-center gap-4">
        <Search3CuteReIcon height={80} width={80} color={accentColor} />
        <Text className="text-text mt-2 text-2xl font-bold">{t("onboarding.interests_title")}</Text>
        <Text className="text-label mb-8 px-6 text-center text-lg">
          {t("onboarding.interests_description")}
        </Text>
      </View>

      <View className="w-full items-center gap-4">
        <View className="flex flex-row">
          <Text className="mr-2 text-base">{t("onboarding.suggestions_feed")}</Text>
          <TouchableOpacity
            onPress={shuffleFeeds}
            className="bg-accent/10 flex-row items-center rounded-full px-3 py-1"
          >
            <Shuffle2CuteReIcon height={16} width={16} color={accentColor} />
            <Text className="text-accent ml-1 text-sm">{t("onboarding.shuffle")}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-center gap-2 px-4">
          {displayFeeds.map((feed) => (
            <FeedChip key={feed.feedId} feed={feed} />
          ))}
        </View>
      </View>
    </OnboardingSectionScreenContainer>
  )
}

const FeedChip = ({ feed }: { feed: PresetFeedConfig }) => {
  const subscription = useSubscription(feed.feedId)
  const [loading, setLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(!!subscription)

  const handleSubscribe = useCallback(
    async (feed: PresetFeedConfig) => {
      if (loading) return
      setLoading(true)
      if (isSubscribed) {
        try {
          setIsSubscribed(false)
          await subscriptionSyncService.unsubscribe(feed.feedId)
        } catch {
          setIsSubscribed(true)
        } finally {
          setLoading(false)
        }
        return
      }
      try {
        setIsSubscribed(true)
        await subscriptionSyncService.subscribe({
          feedId: feed.feedId,
          title: feed.title,
          url: feed.url,
          view: feed.view,
          category: "",
          isPrivate: false,
        })
      } catch {
        setIsSubscribed(false)
      } finally {
        setLoading(false)
      }
    },
    [isSubscribed, loading],
  )

  return (
    <Animated.View
      key={feed.feedId}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <TouchableOpacity
        onPress={() => handleSubscribe(feed)}
        className={cn(
          "flex rounded-full px-4 py-2",
          isSubscribed ? "bg-accent" : "bg-secondary-system-fill",
        )}
      >
        <Text className={`text-center text-sm ${isSubscribed ? "text-white" : "text-label"}`}>
          {feed.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
