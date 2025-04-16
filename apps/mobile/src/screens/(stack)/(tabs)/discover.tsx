import { CategoryEmojiMap, RSSHubCategories } from "@follow/constants"
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
        {/* <Pressable
          className="mt-6 flex-row items-center gap-1 px-6 pt-4"
          onPress={() => {
            navigation.pushControllerView(Recommendations)
          }}
        >
          <Text className="text-label text-2xl font-bold leading-[1.1]">Trending</Text>

          <RightCuteFiIcon height={20} width={20} color={secondaryLabelColor} />
        </Pressable> */}

        {/* <TrendingRecommendations /> */}

        <View className="mt-6 flex-row items-center gap-1 px-6 pt-4">
          <Text className="text-label text-2xl font-bold leading-[1.1]">Good Luck</Text>
        </View>

        <GoodLuck />

        <View className="mt-12 flex-row items-center gap-1 px-6 pt-4">
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

const generateColors = (seed: string) => {
  const hash = seed.split("").reduce((acc, char) => {
    // eslint-disable-next-line unicorn/prefer-code-point
    const chr = char.charCodeAt(0)
    return ((acc << 5) - acc + chr) | 0
  }, 0)

  const hue = Math.abs(hash) % 360

  return [`hsla(${hue}, 80%, 85%, 0.8)`, `hsla(${hue}, 70%, 75%, 0.8)`]
}

const CategoryItem = memo(({ category }: { category: string }) => {
  const { t } = useTranslation("common")
  const name = t(`discover.category.${category}` as any)
  const colors = useMemo(() => generateColors(category), [category])

  const emoji = CategoryEmojiMap[category as keyof typeof CategoryEmojiMap]
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
        colors={colors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-4"
        style={styles.cardItem}
      >
        <View className="flex-1">
          <Text className="absolute right-2 top-2 text-3xl">{emoji}</Text>
          <Text className="absolute bottom-0 left-2 text-lg font-medium text-white">{name}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  cardItem: {
    aspectRatio: 1.6,
  },
})

// const TrendingRecommendations = () => {
//   const { data, isLoading } = useQuery({
//     queryKey: ["trending"],
//     queryFn: () => getTrendingAggregates({ language: "en" }),
//   })
//   const array = data?.trendingFeeds.slice(0, 4)
//   return (
//     <View className="gap-y-4 p-4 pl-8">
//       {array?.map((feed, index) => (
//         <Fragment key={feed.id}>
//           <View className="flex-row items-center gap-2">
//             <FeedIcon size={36} feed={feed as any} />
//             <View>
//               <Text numberOfLines={1} className="text-label text-lg font-medium">
//                 {feed.title}
//               </Text>
//               {!!feed.description && (
//                 <Text numberOfLines={1} className="text-secondary-label text-sm">
//                   {feed.description}
//                 </Text>
//               )}
//             </View>
//           </View>
//           {index !== array.length - 1 && (
//             <View className="bg-opaque-separator dark:bg-non-opaque-separator/50 h-px w-full" />
//           )}
//         </Fragment>
//       ))}
//     </View>
//   )
// }

export const DiscoverTabScreen: TabScreenComponent = Discover
DiscoverTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? Search3CuteReIcon : Search3CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

DiscoverTabScreen.lazy = true
