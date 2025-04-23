import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { LinearGradient } from "expo-linear-gradient"
import { atom } from "jotai"
import { memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Grid } from "@/src/components/ui/grid"
import { Search3CuteFiIcon } from "@/src/icons/search_3_cute_fi"
import { Search3CuteReIcon } from "@/src/icons/search_3_cute_re"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { DiscoverContext } from "@/src/modules/discover/DiscoverContext"
import { GoodLuck } from "@/src/modules/discover/GoodLuck"
import { Recommendations } from "@/src/modules/discover/Recommendations"
import { DiscoverHeader } from "@/src/modules/discover/search"

import { RecommendationCategoryScreen } from "../recommendation/RecommendationCategoryScreen"

export default function Discover() {
  const headerHeightAtom = useState(() => atom(0))[0]

  const ctxValue = useMemo(() => ({ headerHeightAtom }), [headerHeightAtom])

  return (
    <DiscoverContext.Provider value={ctxValue}>
      <SafeNavigationScrollView
        Header={
          <View className="absolute top-0 z-10 w-full">
            <DiscoverHeader />
          </View>
        }
      >
        <View className="mt-6 flex-row items-center gap-1 px-6 pt-4">
          <Text className="text-label text-2xl font-bold leading-[1.1]">Good Luck</Text>
        </View>

        <GoodLuck />

        <View className="mt-4 flex-row items-center gap-1 px-6 pt-4">
          <Text className="text-label text-2xl font-bold leading-[1.1]">Categories</Text>
        </View>

        <DiscoverGrid />
      </SafeNavigationScrollView>
    </DiscoverContext.Provider>
  )
}

const DiscoverGrid = () => {
  return (
    <View className="p-4">
      <Grid columns={2} gap={12}>
        {RSSHubCategories.map((category) => (
          <CategoryItem key={category} category={category} />
        ))}
      </Grid>
    </View>
  )
}

const CategoryItem = memo(({ category }: { category: string }) => {
  const { t } = useTranslation("common")
  const name = t(`discover.category.${category}` as any)
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
        colors={[
          CategoryMap[category as keyof typeof CategoryMap].fromColor,
          CategoryMap[category as keyof typeof CategoryMap].toColor,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-2xl p-4"
        style={styles.cardItem}
      >
        <View className="flex-1">
          <Text className="absolute right-2 top-2 text-4xl">
            {CategoryMap[category as keyof typeof CategoryMap].emoji}
          </Text>
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
export const DiscoverTabScreen: TabScreenComponent = Discover
DiscoverTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? Search3CuteReIcon : Search3CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

DiscoverTabScreen.lazy = true
