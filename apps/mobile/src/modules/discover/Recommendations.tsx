import { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/src/rsshub"
import { isASCII } from "@follow/utils"
import type { ContentStyle } from "@shopify/flash-list"
import { FlashList } from "@shopify/flash-list"
import { useQuery } from "@tanstack/react-query"
import type { FC } from "react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ScrollView } from "react-native"
import {
  Animated,
  Text,
  TouchableOpacity,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from "react-native"
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler"
import { PanGestureHandler } from "react-native-gesture-handler"
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

import { fetchRsshubPopular } from "./api"
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
    queryKey: ["rsshub-popular", "cache", tab.value],
    queryFn: () =>
      fetchRsshubPopular(tab.value, LanguageMap[discoverLanguage]).then((res) => res.data),
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
    const groups = keys.reduce(
      (acc, key) => {
        // A-Z -> A-Z, 0-9 -> #, other -> #, # push to the end
        const firstChar = key[0]!.toUpperCase()
        if (/[A-Z]/.test(firstChar)) {
          acc[firstChar] = acc[firstChar] || []
          acc[firstChar].push(key)
        } else {
          acc["#"] = acc["#"] || []
          acc["#"].push(key)
        }

        return acc
      },
      {} as Record<string, string[]>,
    )

    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const aLetter = a[0]
      const bLetter = b[0]

      return aLetter.localeCompare(bLetter)
    })

    const result = [] as ({ key: string; data: RSSHubRouteDeclaration } | string)[]
    for (const [letter, items] of sortedGroups) {
      result.push(letter)

      for (const item of items) {
        if (!data) {
          continue
        }
        result.push({ key: item, data: data[item]! })
      }
    }

    return result
  }, [data, keys])

  // Add ref for FlashList
  const listRef =
    useRegisterNavigationScrollView<
      FlashList<{ key: string; data: RSSHubRouteDeclaration } | string>
    >(isSelected)

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

  if (isLoading) {
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
    <View className="bg-system-background flex-1" {...rest}>
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
      {/* Right Sidebar */}
      <NavigationSidebar alphabetGroups={alphabetGroups} listRef={listRef} />
    </View>
  )
}

const ItemRenderer = ({
  item,
}: {
  item: string | { key: string; data: RSSHubRouteDeclaration }
}) => {
  if (typeof item === "string") {
    // Rendering header
    return (
      <View className="border-b-opaque-separator mx-6 mb-1 mt-6 pb-1">
        <Text className="text-label mb-4 text-xl font-semibold">{item}</Text>
        <View className="bg-opaque-separator/30 mr-6 h-px" />
      </View>
    )
  } else {
    // Render item
    return (
      <View className="mr-4">
        <RecommendationListItem data={item.data} routePrefix={item.key} />
      </View>
    )
  }
}

const NavigationSidebar: FC<{
  alphabetGroups: (string | { key: string; data: RSSHubRouteDeclaration })[]
  listRef: React.RefObject<FlashList<string | { key: string; data: RSSHubRouteDeclaration }> | null>
}> = memo(({ alphabetGroups, listRef }) => {
  const scrollToLetter = useCallback(
    (letter: string, animated = true) => {
      const index = alphabetGroups.findIndex((group) => {
        if (typeof group !== "string") return false
        const firstChar = group[0]!.toUpperCase()
        const firstCharIsAlphabet = /[A-Z]/.test(firstChar)
        if (firstCharIsAlphabet) {
          return firstChar === letter
        }

        if (letter === "#" && !firstCharIsAlphabet) {
          return true
        }

        return false
      })

      if (index !== -1) {
        listRef.current?.scrollToIndex({
          animated,
          index,
        })
      }
    },
    [alphabetGroups, listRef],
  )
  const titles = useMemo(() => {
    return alphabetGroups.filter((item) => typeof item === "string")
  }, [alphabetGroups])
  // Replace PanResponder with gesture handler
  const handleGesture = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { y } = event.nativeEvent
      const letterHeight = 20 // Approximate height of each letter
      const letter = titles[Math.floor(y / letterHeight)]
      if (!letter) {
        return
      }

      const firstChar = letter[0]!.toUpperCase()
      const firstCharIsAlphabet = /[A-Z]/.test(firstChar)
      if (firstCharIsAlphabet) {
        scrollToLetter(letter, false)
      } else {
        scrollToLetter("#", false)
      }
    },
    [scrollToLetter, titles],
  )

  return (
    <View className="absolute inset-y-0 right-1 h-full items-center justify-center">
      <PanGestureHandler onGestureEvent={handleGesture}>
        <View className="gap-0.5">
          {titles.map((title) => (
            <TouchableOpacity
              hitSlop={5}
              key={title}
              onPress={() => {
                scrollToLetter(title)
              }}
            >
              <Text className="text-tertiary-label text-sm">{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </PanGestureHandler>
    </View>
  )
})
