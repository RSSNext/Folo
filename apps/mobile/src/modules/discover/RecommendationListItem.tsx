import type { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/rsshub"
import type { FC } from "react"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { GroupedInsetListCard, GroupedInsetListCell } from "@/src/components/ui/grouped/GroupedList"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Text } from "@/src/components/ui/typography/Text"
import { FireCuteReIcon } from "@/src/icons/fire_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { RsshubFormScreen } from "@/src/screens/(modal)/RsshubFormScreen"

export const RecommendationListItem: FC<{
  data: RSSHubRouteDeclaration
  routePrefix: string
}> = memo(({ data, routePrefix }) => {
  const { t, i18n } = useTranslation("common")
  const { categories } = useMemo(() => {
    const categories = new Set<string>()
    for (const route in data.routes) {
      const routeData = data.routes[route]!
      if (routeData.categories) {
        routeData.categories.forEach((c: string) => categories.add(c))
      }
    }
    categories.delete("popular")
    return {
      categories: Array.from(categories) as unknown as typeof RSSHubCategories,
    }
  }, [data])
  const navigation = useNavigation()
  return (
    <View className="py-4">
      <View className="mt-1.5 flex-row items-center gap-3 overflow-hidden px-6">
        {/* A long name is truncated instead of pushing the tags off-screen */}
        <View className="flex-1 flex-row items-center gap-3">
          <FeedIcon siteUrl={`https://${data.url}`} size={24} />
          <Text className="shrink text-base font-medium text-text" numberOfLines={1}>
            {data.name}
          </Text>
        </View>
        {/* Tags wrap onto more lines, as on desktop, when a site has many */}
        <View className="max-w-[60%] flex-row flex-wrap justify-end gap-1">
          {categories.map((c) => (
            <View
              className="shrink items-center justify-center overflow-hidden rounded-full bg-system-fill px-3 py-1"
              key={c}
            >
              <Text className="text-xs text-text/70" numberOfLines={1}>
                {/* Routes can use tags without a translation, such as "other"; show their name */}
                {i18n.exists(`discover.category.${c}`, { ns: "common" })
                  ? t(`discover.category.${c}`)
                  : c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <GroupedInsetListCard className="mt-5">
        {Object.keys(data.routes)
          .sort((a, b) => (data.routes[b]!.heat || 0) - (data.routes[a]!.heat || 0))
          .map((route) => (
            <GroupedInsetListCell
              key={route}
              label={data.routes[route]!.name}
              onPress={() => {
                navigation.presentControllerView(RsshubFormScreen, {
                  routePrefix,
                  route: data.routes[route]!,
                  name: data.name,
                })
              }}
            >
              <View className="flex-row items-center gap-1">
                {!!data.routes[route]!.heat && (
                  <>
                    <FireCuteReIcon width={12} height={12} />
                    <Text
                      ellipsizeMode="middle"
                      numberOfLines={1}
                      className="whitespace-pre text-xs text-text/70"
                    >
                      {data.routes[route]!.heat}
                    </Text>
                  </>
                )}
              </View>
            </GroupedInsetListCell>
          ))}
      </GroupedInsetListCard>
    </View>
  )
})
