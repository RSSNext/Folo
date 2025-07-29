import type { RSSHubCategory } from "@follow/constants"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { LinearGradient } from "expo-linear-gradient"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
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
  const navigation = useNavigation()
  const label = useColor("label")
  return (
    <>
      <View className="mt-4 flex-row items-center justify-between pb-1 pl-6 pr-5 pt-4">
        <View className="flex-row items-center gap-2">
          <Grid2CuteReIcon width={24} height={24} color={label} />
          <Text className="text-label pb-2 text-2xl font-bold leading-[1.1]">Categories</Text>
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
