import type { RSSHubCategory } from "@follow/constants"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { Grid } from "@/src/components/ui/grid"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Text } from "@/src/components/ui/typography/Text"
import { FilterCuteReIcon } from "@/src/icons/filter_cute_re"
import { Grid2CuteReIcon } from "@/src/icons/grid_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { Recommendations } from "@/src/modules/discover/Recommendations"
import { DiscoverSettingsScreen } from "@/src/screens/(modal)/DiscoverSettingsScreen"
import { RecommendationCategoryScreen } from "@/src/screens/(stack)/recommendation/RecommendationCategoryScreen"

export const Category = () => {
  const { t } = useTranslation("common")
  const navigation = useNavigation()
  const label = useColor("label")
  return (
    <>
      <View className="mt-4 flex-row items-center justify-between pb-1 pl-6 pr-5 pt-4">
        <View className="flex-row items-center gap-2">
          <Grid2CuteReIcon width={24} height={24} color={label} />
          <Text className="pb-2 text-xl font-bold leading-[1.1] text-label">
            {t("words.categories")}
          </Text>
        </View>
        <ItemPressable
          className="rounded-lg p-1"
          itemStyle={ItemPressableStyle.UnStyled}
          onPress={() => {
            navigation.presentControllerView(DiscoverSettingsScreen)
          }}
        >
          <FilterCuteReIcon width={20} height={20} color={label} />
        </ItemPressable>
      </View>

      <Grid columns={2} gap={12} className="p-4">
        {RSSHubCategories.map((category) => (
          <CategoryItem key={category} category={category} />
        ))}
      </Grid>
    </>
  )
}

const emojiCdnBaseUrl = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72"

const getEmojiImageUrl = (emoji: string) => {
  const codePoints = Array.from(emoji)
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((value): value is string => Boolean(value) && value !== "fe0f")

  return `${emojiCdnBaseUrl}/${codePoints.join("-")}.png`
}

const CategoryEmoji = ({ emoji }: { emoji: string }) => {
  const [useTextFallback, setUseTextFallback] = useState(false)
  const emojiImageUrl = useMemo(() => getEmojiImageUrl(emoji), [emoji])

  return (
    <View style={styles.emojiContainer}>
      {useTextFallback ? (
        <Text allowFontScaling={false} style={styles.emojiText}>
          {emoji}
        </Text>
      ) : (
        <Image
          allowDownscaling
          cachePolicy="memory-disk"
          contentFit="contain"
          onError={() => setUseTextFallback(true)}
          source={emojiImageUrl}
          style={styles.emojiImage}
        />
      )}
    </View>
  )
}

const CategoryItem = memo(({ category }: { category: RSSHubCategory }) => {
  const { t } = useTranslation("common")
  const name = t(`discover.category.${category}`)
  const navigation = useNavigation()
  const { emoji } = CategoryMap[category]
  return (
    <Pressable
      className="overflow-hidden rounded-2xl"
      key={category}
      onPress={() => {
        if (category === "all") {
          navigation.pushControllerView(Recommendations)
        } else {
          navigation.pushControllerView(RecommendationCategoryScreen, {
            category,
          })
        }
      }}
    >
      <LinearGradient
        colors={[`${CategoryMap[category].color}80`, CategoryMap[category].color]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 0,
          y: 1,
        }}
        className="rounded-2xl p-4"
        style={styles.cardItem}
      >
        <View className="flex-1">
          <CategoryEmoji emoji={emoji} />
          <Text className="absolute bottom-0 left-2 text-lg font-bold text-white">{name}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  )
})
const styles = StyleSheet.create({
  cardItem: {
    aspectRatio: 16 / 9,
  },
  emojiContainer: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
    ...(Platform.OS === "android"
      ? {
          includeFontPadding: false,
        }
      : {}),
  },
  emojiImage: {
    width: 40,
    height: 40,
  },
})
