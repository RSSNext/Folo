import { cn } from "@follow/utils"
import { debounce } from "es-toolkit/compat"
import type { FC } from "react"
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type {
  Animated as AnimatedNative,
  LayoutChangeEvent,
  StyleProp,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { accentColor, useColor } from "@/src/theme/colors"

import type { Tab } from "./types"

interface TabBarProps {
  tabs: Tab[]

  tabbarClassName?: string
  tabbarStyle?: StyleProp<ViewStyle>

  TabItem?: FC<{ isSelected: boolean; tab: Tab } & Pick<TouchableOpacityProps, "onLayout">>

  onTabItemPress?: (index: number) => void
  currentTab?: number

  tabScrollContainerAnimatedX?: AnimatedNative.Value
}

const springConfig = {
  stiffness: 100,
  damping: 10,
}

export const TabBar = forwardRef<ScrollView, TabBarProps>(
  (
    {
      tabs,
      TabItem = Pressable,
      tabbarClassName,
      tabbarStyle,

      onTabItemPress,
      currentTab: tab,
      tabScrollContainerAnimatedX: pagerOffsetX,
    },
    ref,
  ) => {
    const [currentTab, setCurrentTab] = useState(tab || 0)
    const [tabWidths, setTabWidths] = useState<number[]>([])
    const [tabPositions, setTabPositions] = useState<number[]>([])
    const indicatorPosition = useSharedValue(0)

    useEffect(() => {
      if (typeof tab === "number") {
        setCurrentTab(tab)
      }
    }, [tab])

    const sharedPagerOffsetX = useSharedValue(0)
    const [tabBarWidth, setTabBarWidth] = useState(0)
    useEffect(() => {
      if (pagerOffsetX) {
        return
      }
      sharedPagerOffsetX.value = withSpring(currentTab * tabBarWidth, springConfig)
    }, [currentTab, pagerOffsetX, sharedPagerOffsetX, tabBarWidth])
    useEffect(() => {
      if (!pagerOffsetX) return
      const id = pagerOffsetX.addListener(({ value }) => {
        sharedPagerOffsetX.value = value
      })
      return () => {
        pagerOffsetX.removeListener(id)
      }
    }, [pagerOffsetX, sharedPagerOffsetX])
    const tabRef = useRef<ScrollView>(null)

    const handleChangeTabIndex = useCallback((index: number) => {
      setCurrentTab(index)
      onTabItemPress?.(index)
    }, [])
    useEffect(() => {
      if (!pagerOffsetX) return
      const listener = pagerOffsetX.addListener(
        debounce(({ value }) => {
          // Calculate which tab should be active based on scroll position
          const tabIndex = Math.round(value / tabBarWidth)
          if (tabIndex !== currentTab) {
            handleChangeTabIndex(tabIndex)
          }
        }, 36),
      )

      return () => pagerOffsetX.removeListener(listener)
    }, [currentTab, handleChangeTabIndex, onTabItemPress, pagerOffsetX, tabBarWidth])

    useImperativeHandle(ref, () => tabRef.current!)
    useEffect(() => {
      if (tabWidths.length > 0) {
        indicatorPosition.value = withSpring(tabPositions[currentTab] || 0, springConfig)
      }
    }, [currentTab, indicatorPosition, tabPositions, tabWidths.length])

    const tabBarScrollX = useRef(0)
    useEffect(() => {
      // If the current tab is not within the visible range of the scrollview, then scroll the scrollview to the visible area.
      if (tabRef.current && tabPositions[currentTab] !== undefined && tabWidths[currentTab]) {
        const tabPosition = tabPositions[currentTab]
        const tabWidth = tabWidths[currentTab]

        // Get the current scroll position and visible width of the ScrollView
        const scrollView = tabRef.current
        const currentScrollX = tabBarScrollX.current

        const visibleWidth = tabBarWidth

        // Check if the tab is outside the visible area
        const isTabOutsideView =
          tabPosition < currentScrollX || // tab is to the left of visible area
          tabPosition + tabWidth > currentScrollX + visibleWidth // tab is to the right

        if (isTabOutsideView) {
          // Add some padding to ensure the tab isn't right at the edge
          const padding = 16

          scrollView.scrollTo({
            x: Math.max(0, tabPosition - padding),
            animated: true,
          })
        }
      }
    }, [currentTab, sharedPagerOffsetX.value, tabPositions, tabWidths, tabBarWidth])

    const handleTabItemLayout = useCallback((event: LayoutChangeEvent, index: number) => {
      const { width, x } = event.nativeEvent.layout
      setTabWidths((prev) => {
        const newWidths = [...prev]
        newWidths[index] = width
        return newWidths
      })
      setTabPositions((prev) => {
        const newPositions = [...prev]
        newPositions[index] = x
        return newPositions
      })
    }, [])
    const indicatorStyle = useAnimatedStyle(() => {
      const scrollProgress = Math.max(sharedPagerOffsetX.value / tabBarWidth, 0)

      const currentIndex = Math.floor(scrollProgress)
      const nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
      const progress = scrollProgress - currentIndex

      // Interpolate between current and next tab positions
      const xPosition =
        tabPositions[currentIndex]! +
        (tabPositions[nextIndex]! - tabPositions[currentIndex]!) * progress

      // Interpolate between current and next tab widths
      const width =
        tabWidths[currentIndex]! + (tabWidths[nextIndex]! - tabWidths[currentIndex]!) * progress

      return {
        transform: [{ translateX: Math.max(xPosition, 0) }],
        width,
        backgroundColor: tabs[currentTab]!.activeColor || accentColor,
      }
    })

    return (
      <ScrollView
        onLayout={(event) => {
          setTabBarWidth(event.nativeEvent.layout.width)
        }}
        onScroll={(event) => {
          tabBarScrollX.current = event.nativeEvent.contentOffset.x
        }}
        showsHorizontalScrollIndicator={false}
        className={cn(
          "border-tertiary-system-background relative shrink-0 grow-0",
          tabbarClassName,
        )}
        horizontal
        ref={tabRef}
        contentContainerStyle={styles.tabScroller}
        style={[styles.root, tabbarStyle]}
      >
        {tabs.map((tab, index) => (
          <TarBarItem
            TabItem={TabItem}
            key={tab.value}
            index={index}
            onTabItemPress={handleChangeTabIndex}
            onLayout={handleTabItemLayout}
            isSelected={currentTab === index}
            tab={tab}
          />
        ))}

        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </ScrollView>
    )
  },
)

const styles = StyleSheet.create({
  tabScroller: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  root: { paddingHorizontal: 6 },

  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
})

const TabItemInner = ({ tab, isSelected }: { tab: Tab; isSelected: boolean }) => {
  const gray = useColor("gray")
  return (
    <View className="p-2">
      <Text style={{ color: isSelected ? accentColor : gray }} className="text-[15px] leading-none">
        {tab.name}
      </Text>
    </View>
  )
}

const TarBarItem: FC<{
  TabItem: FC<{ isSelected: boolean; tab: Tab } & Pick<TouchableOpacityProps, "onLayout">>
  onTabItemPress: (index: number) => void
  isSelected: boolean
  tab: Tab

  index: number
  onLayout: (event: LayoutChangeEvent, index: number) => void
}> = memo(({ TabItem = Pressable, onTabItemPress, isSelected, tab, onLayout, index }) => {
  return (
    <TabItem
      onPress={() => {
        onTabItemPress(index)
      }}
      key={tab.value}
      isSelected={isSelected}
      onLayout={(event) => {
        onLayout(event, index)
      }}
      tab={tab}
    >
      <TabItemInner tab={tab} isSelected={isSelected} />
    </TabItem>
  )
})
