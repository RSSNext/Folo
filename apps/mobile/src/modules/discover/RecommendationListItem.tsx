import type { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/src/rsshub"
import type { FC } from "react"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Clipboard, Text, TouchableOpacity, View } from "react-native"
import WebView from "react-native-webview"
import * as ContextMenu from "zeego/context-menu"

import { Grid } from "@/src/components/ui/grid"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { RsshubFormScreen } from "@/src/screens/(modal)/rsshub-form"

export const RecommendationListItem: FC<{
  data: RSSHubRouteDeclaration
  routePrefix: string
}> = memo(({ data, routePrefix }) => {
  const { t } = useTranslation("common")
  const { maintainers, categories } = useMemo(() => {
    const maintainers = new Set<string>()
    const categories = new Set<string>()
    for (const route in data.routes) {
      const routeData = data.routes[route]!
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
      categories: Array.from(categories) as unknown as typeof RSSHubCategories,
    }
  }, [data])

  const navigation = useNavigation()

  return (
    <View className="flex-row items-center p-4 px-6">
      <View className="mt-1.5 flex-row self-start overflow-hidden rounded-lg">
        <FeedIcon siteUrl={`https://${data.url}`} size={28} />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between gap-4">
          <Text className="text-text text-lg font-medium">{data.name}</Text>
          {/* Tags */}
          <View className="shrink flex-row items-center">
            {categories.map((c) => (
              <View
                className="bg-gray-6 mr-1 items-center justify-center overflow-hidden rounded-full px-3 py-1"
                key={c}
              >
                <Text className="text-text/60 text-xs" numberOfLines={1}>
                  {t(`discover.category.${c}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Maintainers */}
        <View className="mb-1 flex-row flex-wrap items-center">
          {maintainers.map((m) => (
            <ContextMenu.Root key={m}>
              <ContextMenu.Trigger asChild>
                <View className="bg-system-background mr-1 rounded-full">
                  <Text className="text-secondary-label text-sm">@{m}</Text>
                </View>
              </ContextMenu.Trigger>

              <ContextMenu.Content>
                <ContextMenu.Preview size="STRETCH">
                  {() => <WebView source={{ uri: `https://github.com/${m}` }} />}
                </ContextMenu.Preview>

                <ContextMenu.Item
                  key="copyMaintainerName"
                  onSelect={() => {
                    Clipboard.setString(m)
                    toast.info("Name copied to clipboard")
                  }}
                >
                  <ContextMenu.ItemTitle>Copy Maintainer Name</ContextMenu.ItemTitle>
                  <ContextMenu.ItemIcon
                    ios={{
                      name: "doc.on.doc",
                    }}
                  />
                </ContextMenu.Item>

                <ContextMenu.Item
                  key="openMaintainerProfile"
                  onSelect={() => {
                    openLink(`https://github.com/${m}`)
                  }}
                >
                  <ContextMenu.ItemTitle>Open Maintainer's Profile</ContextMenu.ItemTitle>
                  <ContextMenu.ItemIcon
                    ios={{
                      name: "link",
                    }}
                  />
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          ))}
        </View>

        {/* Items */}

        <Grid columns={2} gap={8} className="mt-1">
          {Object.keys(data.routes).map((route) => (
            <View className="relative" key={route}>
              <TouchableOpacity
                onPress={() => {
                  navigation.presentControllerView(RsshubFormScreen, {
                    routePrefix,
                    route: data.routes[route]!,
                    name: data.name,
                  })
                }}
                className="bg-gray-6 h-10 flex-row items-center justify-center overflow-hidden rounded-xl px-2"
              />
              <View className="absolute inset-2 items-center justify-center" pointerEvents="none">
                <Text
                  ellipsizeMode="middle"
                  numberOfLines={1}
                  className="text-text whitespace-pre font-medium"
                >
                  {data.routes[route]!.name}
                </Text>
              </View>
            </View>
          ))}
        </Grid>
      </View>
    </View>
  )
})
