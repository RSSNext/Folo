import type { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/src/rsshub"
import type { FC } from "react"
import { useMemo } from "react"
import { Clipboard, Linking, Text, View } from "react-native"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"

import { RSSHubCategoryCopyMap } from "./copy"

export const RecommendationCard: FC<{
  data: RSSHubRouteDeclaration
}> = ({ data }) => {
  const { maintainers, categories } = useMemo(() => {
    const maintainers = new Set<string>()
    const categories = new Set<string>()
    for (const route in data.routes) {
      const routeData = data.routes[route]
      if (routeData.maintainers) {
        routeData.maintainers.forEach((m) => maintainers.add(m))
      }
      if (routeData.categories) {
        routeData.categories.forEach((c) => categories.add(c))
      }
    }
    categories.delete("popular")
    return {
      maintainers: Array.from(maintainers),
      categories: Array.from(categories) as typeof RSSHubCategories | string[],
    }
  }, [data])

  return (
    <View className="flex-row items-center p-4 px-6">
      <View className="overflow-hidden rounded-lg">
        <FeedIcon siteUrl={`https://${data.url}`} size={28} />
      </View>
      <View className="ml-2">
        <Text className="text-text text-base font-medium">{data.name}</Text>
        {/* Maintainers */}
        <View className="flex-row items-center">
          {maintainers.map((m) => (
            <ContextMenu
              key={m}
              actions={[
                {
                  title: "Copy Maintainer Name",
                },
                {
                  title: "Open Maintainer's Profile",
                },
              ]}
              onPress={(e) => {
                switch (e.nativeEvent.index) {
                  case 0: {
                    Clipboard.setString(m)
                    break
                  }
                  case 1: {
                    Linking.openURL(`https://github.com/${m}`)
                    break
                  }
                }
              }}
            >
              <View className="bg-system-background mr-1 rounded-full">
                <Text className="text-secondary-label text-sm">@{m}</Text>
              </View>
            </ContextMenu>
          ))}
        </View>
        {/* Tags */}
        <View className="mt-0.5 flex-row items-center">
          {categories.map((c) => (
            <View
              className="bg-gray-5 mr-1 items-center justify-center overflow-hidden rounded-lg px-2 py-1"
              key={c}
            >
              <Text className="text-text/60 text-sm leading-none">
                {RSSHubCategoryCopyMap[c as keyof typeof RSSHubCategoryCopyMap]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
