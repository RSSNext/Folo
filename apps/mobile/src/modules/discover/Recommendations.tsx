import { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/rsshub"
import { isASCII } from "@follow/utils"
import type { ContentStyle } from "@shopify/flash-list"
import { FlashList } from "@shopify/flash-list"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ScrollView } from "react-native"
import { Animated, Text, useAnimatedValue, useWindowDimensions, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import { useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useUISettingKey } from "@/src/atoms/settings/ui"
import { AnimatedScrollView } from "@/src/components/common/AnimatedComponents"
import { BlurEffect } from "@/src/components/common/BlurEffect"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { TabBar } from "@/src/components/ui/tabview/TabBar"
import type { TabComponent } from "@/src/components/ui/tabview/TabView"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useColor } from "@/src/theme/colors"

import { fetchRsshubAnalysis, fetchRsshubPopular } from "./api"
import { RecommendationListItem } from "./RecommendationListItem"

export const Recommendations = () => {
  const { t } = useTranslation("common")

  const animatedX = useAnimatedValue(0)
  const [currentTab, setCurrentTab] = useState(0)
  const windowWidth = useWindowDimensions().width
  const ref = useRef<ScrollView>(null)

  useEffect(() => {
    ref.current?.scrollTo({ x: currentTab * windowWidth, y: 0, animated: true })
  }, [ref, currentTab, windowWidth])

  const [loadedTabIndex, setLoadedTabIndex] = useState(() => new Set())
  useEffect(() => {
    setLoadedTabIndex((prev) => {
      prev.add(currentTab)
      return new Set(prev)
    })
  }, [currentTab])

  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const label = useColor("label")
  return (
    <View className="flex-1">
      <View className="pt-safe absolute inset-x-0 top-0 z-10 flex flex-row items-center">
        <BlurEffect />

        <UINavigationHeaderActionButton
          onPress={() => {
            navigation.back()
          }}
          className="-mb-2 ml-4"
        >
          <MingcuteLeftLineIcon color={label} height={20} width={20} />
        </UINavigationHeaderActionButton>
        <TabBar
          tabScrollContainerAnimatedX={animatedX}
          tabbarClassName="pt-2"
          tabs={RSSHubCategories.map((category) => ({
            name: t(`discover.category.${category}`),
            value: category,
          }))}
          currentTab={currentTab}
          onTabItemPress={(tab) => {
            setCurrentTab(tab)
          }}
        />
      </View>
      <AnimatedScrollView
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: animatedX } } }], {
          useNativeDriver: true,
        })}
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
      >
        {RSSHubCategories.map((category, index) => (
          <View className="flex-1" style={{ width: windowWidth }} key={category}>
            {loadedTabIndex.has(index) && (
              <RecommendationTab
                key={category}
                insets={{ top: 44 + insets.top - 10, bottom: insets.bottom }}
                contentContainerStyle={{
                  paddingTop: 44 + insets.top,
                  paddingBottom: insets.bottom,
                }}
                tab={{ name: t(`discover.category.${category}`), value: category }}
                isSelected={currentTab === index}
              />
            )}
          </View>
        ))}
      </AnimatedScrollView>
    </View>
  )
}

const LanguageMap = {
  all: "all",
  eng: "en",
  cmn: "zh-CN",
} as const

export const RecommendationTab: TabComponent<{
  contentContainerStyle?: ContentStyle
  insets?: { top?: number; bottom?: number }
  reanimatedScrollY?: SharedValue<number>
}> = ({
  tab,
  isSelected,
  contentContainerStyle,
  reanimatedScrollY,
  insets: customInsets,
  ...rest
}) => {
  const discoverLanguage = useUISettingKey("discoverLanguage")

  const { data, isLoading } = useQuery({
    queryKey: ["rsshub-popular", tab.value, discoverLanguage],
    queryFn: () =>
      fetchRsshubPopular(tab.value, LanguageMap[discoverLanguage]).then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    meta: {
      persist: true,
    },
  })

  const { data: analysisData, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ["rsshub-analysis", discoverLanguage],
    queryFn: () => fetchRsshubAnalysis(LanguageMap[discoverLanguage]).then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    meta: {
      persist: true,
    },
  })

  const keys = useMemo(() => {
    if (!data) {
      return []
    }

    return Object.keys(data).sort((a, b) => {
      const aname = data[a]!.name
      const bname = data[b]!.name

      const aRouteName = data[a]!.routes[Object.keys(data[a]!.routes)[0]!]!.name
      const bRouteName = data[b]!.routes[Object.keys(data[b]!.routes)[0]!]!.name

      const ia = isASCII(aname) && isASCII(aRouteName)
      const ib = isASCII(bname) && isASCII(bRouteName)

      if (ia && ib) {
        return aname.toLowerCase() < bname.toLowerCase() ? -1 : 1
      } else if (ia || ib) {
        return ia > ib ? -1 : 1
      } else {
        return 0
      }
    })
  }, [data])

  const alphabetGroups = useMemo(() => {
    const result = [] as { key: string; data: RSSHubRouteDeclaration }[]
    for (const item of keys) {
      if (!data) {
        continue
      }
      const dataWithAnalysis = data[item]! as RSSHubRouteDeclaration
      for (const route in dataWithAnalysis.routes) {
        const routeData = dataWithAnalysis.routes[route]!
        routeData.heat = analysisData?.[`/${item}${route}`]?.subscriptionCount || 0
        routeData.topFeeds = analysisData?.[`/${item}${route}`]?.topFeeds || []
      }
      result.push({
        key: item,
        data: dataWithAnalysis,
      })
    }

    result.sort((a, b) => {
      let aHeat = 0
      let bHeat = 0
      if (typeof a === "string") {
        aHeat = 0
      } else {
        aHeat = Object.values(a.data.routes).reduce((acc, route) => acc + (route.heat || 0), 0)
      }
      if (typeof b === "string") {
        bHeat = 0
      } else {
        bHeat = Object.values(b.data.routes).reduce((acc, route) => acc + (route.heat || 0), 0)
      }
      return bHeat - aHeat
    })

    return result
  }, [data, keys, analysisData])

  // Add ref for FlashList
  const listRef =
    useRegisterNavigationScrollView<FlashList<{ key: string; data: RSSHubRouteDeclaration }>>(
      isSelected,
    )

  const getItemType = useRef((item: string | { key: string }) => {
    return typeof item === "string" ? "sectionHeader" : "row"
  }).current

  const keyExtractor = useRef((item: string | { key: string }) => {
    return typeof item === "string" ? item : item.key
  }).current

  const scrollOffsetRef = useRef(0)
  const animatedY = useSharedValue(0)

  useEffect(() => {
    if (isSelected) {
      animatedY.value = scrollOffsetRef.current
    }
  }, [animatedY, isSelected])

  const insets = useSafeAreaInsets()

  if (isLoading || isAnalysisLoading) {
    return <PlatformActivityIndicator className="flex-1 items-center justify-center" />
  }

  if (keys.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-secondary-label">This is a barren wasteland of knowledge.</Text>
      </View>
    )
  }

  return (
    <View className="bg-system-grouped-background flex-1" {...rest}>
      <FlashList
        onScroll={(e) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y
          animatedY.value = scrollOffsetRef.current
          if (reanimatedScrollY) {
            reanimatedScrollY.value = scrollOffsetRef.current
          }
        }}
        scrollEventThrottle={16}
        estimatedItemSize={150}
        ref={listRef}
        data={alphabetGroups}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={ItemRenderer}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustsScrollIndicatorInsets={false}
        contentContainerStyle={contentContainerStyle}
        scrollIndicatorInsets={{
          right: -2,
          top: customInsets?.top ?? 0,
          bottom: customInsets?.bottom ?? insets.bottom,
        }}
        removeClippedSubviews
      />
    </View>
  )
}

const ItemRenderer = ({ item }: { item: { key: string; data: RSSHubRouteDeclaration } }) => {
  return <RecommendationListItem data={item.data} routePrefix={item.key} />
}
