import { cn } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { Text, View } from "react-native"

import { useUISettingKey } from "@/src/atoms/settings/ui"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { FilterCuteReIcon } from "@/src/icons/filter_cute_re"
import { TrendingUpCuteReIcon } from "@/src/icons/trending_up_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { DiscoverSettingsScreen } from "@/src/screens/(modal)/DiscoverSettingsScreen"

import { fetchFeedTrending } from "./api"
import { FeedSummary } from "./FeedSummary"

export const Trending = ({
  className,
  itemClassName,
}: {
  className?: string
  itemClassName?: string
}) => {
  const discoverLanguage = useUISettingKey("discoverLanguage")
  const { data, isLoading } = useQuery({
    queryKey: ["trending", "feeds", discoverLanguage],
    queryFn: () =>
      fetchFeedTrending({
        lang: discoverLanguage === "all" ? undefined : discoverLanguage,
        limit: 20,
      }).then((res) => res.data),
  })
  const navigation = useNavigation()

  return (
    <View className={className}>
      <View className={cn("flex-row items-center justify-between pb-1 pt-4", itemClassName)}>
        <View className="flex-row items-center gap-2">
          <TrendingUpCuteReIcon width={24} height={24} />
          <Text className="text-label text-2xl font-bold leading-[1.1]">Trending</Text>
        </View>
        <ItemPressable
          className="rounded-lg p-1"
          itemStyle={ItemPressableStyle.UnStyled}
          onPress={() => {
            navigation.presentControllerView(DiscoverSettingsScreen)
          }}
        >
          <FilterCuteReIcon width={20} height={20} />
        </ItemPressable>
      </View>

      <View className="mt-4">
        {isLoading ? (
          <View className="mt-5 flex h-12 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        ) : (
          data?.map((item, index) => (
            <FeedSummary
              key={item.feed?.id}
              item={item}
              className={cn("flex flex-1 flex-row items-center bg-none py-3", itemClassName)}
              simple
              preChildren={
                <View
                  className={cn(
                    "mr-4 flex size-6 items-center justify-center rounded-full",
                    index < 3
                      ? cn(
                          "bg-accent text-white",
                          index === 0 && "bg-accent",
                          index === 1 && "bg-accent/90",
                          index === 2 && "bg-accent/80",
                        )
                      : "bg-gray-5/60",
                  )}
                >
                  <Text className={cn("text-xs font-medium", index < 3 && "text-white")}>
                    {index + 1}
                  </Text>
                </View>
              }
            />
          ))
        )}
      </View>
    </View>
  )
}
