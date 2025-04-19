import { cn } from "@follow/utils"
import type { FC } from "react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import type { ScrollView, StyleProp, TouchableOpacityProps, ViewStyle } from "react-native"
import {
  Animated as RnAnimated,
  Pressable,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from "react-native"
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils"

import { AnimatedScrollView } from "../../common/AnimatedComponents"
import { TabBar } from "./TabBar"

type Tab = {
  name: string
  activeColor?: string
  value: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TabComponent<T extends {} = {}> = FC<
  { isSelected: boolean; tab: Tab } & T & Pick<ViewProps, "onLayout">
>
interface TabViewProps {
  tabs: Tab[]
  Tab?: TabComponent
  TabItem?: FC<{ isSelected: boolean; tab: Tab } & Pick<TouchableOpacityProps, "onLayout">>
  initialTab?: number
  onTabChange?: (tab: number) => void

  // styles
  tabbarClassName?: string
  tabbarStyle?: StyleProp<ViewStyle>
  scrollerStyle?: StyleProp<ViewStyle>
  scrollerContainerStyle?: StyleProp<ViewStyle>
  scrollerContainerClassName?: string
  scrollerClassName?: string

  lazyTab?: boolean
  lazyOnce?: boolean
}

export const TabView: FC<TabViewProps> = ({
  tabs,
  Tab = View,
  TabItem = Pressable,
  initialTab,
  onTabChange,

  tabbarClassName,
  tabbarStyle,
  scrollerClassName,
  scrollerStyle,
  scrollerContainerStyle,
  scrollerContainerClassName,

  lazyOnce,
  lazyTab,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab ?? 0)

  const pagerOffsetX = useAnimatedValue(0)

  const { width: windowWidth } = useWindowDimensions()

  const [lazyTabSet, setLazyTabSet] = useState(() => new Set<number>())

  const shouldRenderCurrentTab = (index: number) => {
    if (!lazyTab) return true
    if (index === currentTab) return true
    if (lazyOnce && lazyTabSet.has(index)) return true
    return lazyTabSet.has(index)
  }

  useEffect(() => {
    setLazyTabSet((prev) => {
      const newSet = new Set(prev)
      newSet.add(currentTab)
      return newSet
    })
  }, [currentTab])

  const contentScrollerRef = useRef<ScrollView>(null)

  return (
    <>
      <TabBar
        onTabItemPress={useCallback(
          (index: number) => {
            contentScrollerRef.current?.scrollTo({ x: index * windowWidth, y: 0, animated: true })
            setCurrentTab(index)
            onTabChange?.(index)
          },
          [onTabChange, windowWidth],
        )}
        tabs={tabs}
        currentTab={currentTab}
        tabbarClassName={tabbarClassName}
        tabbarStyle={tabbarStyle}
        TabItem={TabItem}
        tabScrollContainerAnimatedX={pagerOffsetX}
      />

      <AnimatedScrollView
        onScroll={RnAnimated.event([{ nativeEvent: { contentOffset: { x: pagerOffsetX } } }], {
          useNativeDriver: true,
        })}
        ref={contentScrollerRef}
        horizontal
        pagingEnabled
        className={cn("flex-1", scrollerClassName)}
        style={scrollerStyle}
        contentContainerStyle={scrollerContainerStyle}
        contentContainerClassName={scrollerContainerClassName}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
      >
        {tabs.map((tab, index) => (
          <View className="flex-1" style={{ width: windowWidth }} key={tab.value}>
            {shouldRenderCurrentTab(index) && (
              <TabComponent
                key={tab.value}
                tab={tab}
                isSelected={currentTab === index}
                Tab={Tab as TabComponent}
              />
            )}
          </View>
        ))}
      </AnimatedScrollView>
    </>
  )
}

const TabComponent: FC<{
  tab: Tab
  isSelected: boolean
  Tab: TabComponent
}> = memo(({ tab, isSelected, Tab = View }) => {
  const { width: windowWidth } = useWindowDimensions()
  return (
    <View className="flex-1" style={{ width: windowWidth }} key={tab.value}>
      <Tab isSelected={isSelected} tab={tab} />
    </View>
  )
})
