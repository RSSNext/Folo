import type { RSSHubCategory } from "@follow/constants"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { LinearGradient } from "expo-linear-gradient"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { Grid } from "@/src/components/ui/grid"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { GoodLuck } from "@/src/modules/discover/GoodLuck"
import { Recommendations } from "@/src/modules/discover/Recommendations"
import { RecommendationCategoryScreen } from "@/src/screens/(stack)/recommendation/RecommendationCategoryScreen"

export function DiscoverContent() {
  return (
    <View>
      <View className="flex-row items-center gap-1 px-6 pt-4">
        <Text className="text-label text-2xl font-bold leading-[1.1]">Good Luck</Text>
      </View>

      <GoodLuck />

      <View className="mt-4 flex-row items-center gap-1 px-6 pt-4">
        <Text className="text-label text-2xl font-bold leading-[1.1]">Categories</Text>
      </View>

      <DiscoverGrid />
    </View>
  )
}

const DiscoverGrid = () => {
  return (
    <Grid columns={2} gap={12} className="p-4">
      {RSSHubCategories.map((category) => (
        <CategoryItem key={category} category={category} />
      ))}
    </Grid>
  )
}

const CategoryItem = memo(({ category }: { category: RSSHubCategory }) => {
  const { t } = useTranslation("common")
  const name = t(`discover.category.${category}`)
  const navigation = useNavigation()

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
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-2xl p-4"
        style={styles.cardItem}
      >
        <View className="flex-1">
          <Text className="absolute right-2 top-2 text-4xl">{CategoryMap[category].emoji}</Text>
          <Text className="absolute bottom-0 left-2 text-xl font-bold text-white">{name}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  cardItem: {
    aspectRatio: 16 / 9,
  },
})
