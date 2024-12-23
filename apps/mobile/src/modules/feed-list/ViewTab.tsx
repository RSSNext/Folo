import { useHeaderHeight } from "@react-navigation/elements"
import { useAtom, useAtomValue } from "jotai"
import { useEffect, useRef, useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import type { WithSpringConfig } from "react-native-reanimated"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { bottomViewTabHeight } from "@/src/constants/ui"
import { views } from "@/src/constants/views"

import { offsetAtom, viewAtom } from "./atoms"

export const ViewTab = () => {
  const headerHeight = useHeaderHeight()
  const offset = useAtomValue(offsetAtom)
  const [currentView, setCurrentView] = useAtom(viewAtom)
  const tabRef = useRef<ScrollView>(null)

  const indicatorPosition = useSharedValue(0)

  const [tabWidths, setTabWidths] = useState<number[]>([])
  const [tabPositions, setTabPositions] = useState<number[]>([])

  const springConfig: WithSpringConfig = {
    damping: 20,
    mass: 1,
    stiffness: 120,
  }

  useEffect(() => {
    if (tabWidths.length > 0) {
      indicatorPosition.value = withSpring(tabPositions[currentView] || 0, springConfig)

      if (tabRef.current) {
        tabRef.current.scrollTo({ x: currentView * 60, y: 0, animated: true })
      }
    }
  }, [currentView, tabPositions, tabWidths])

  const nextTabPosition = tabPositions[currentView + 1] || tabPositions[currentView]
  const prevTabPosition = tabPositions[currentView - 1] || tabPositions[currentView]

  const nextTabWidth = tabWidths[currentView + 1] || tabWidths[currentView]
  const prevTabWidth = tabWidths[currentView - 1] || tabWidths[currentView]

  const indicatorStyle = useAnimatedStyle(() => {
    if (offset === 0) {
      return {
        transform: [{ translateX: indicatorPosition.value }],
        backgroundColor: views[currentView].activeColor,
        width: tabWidths[currentView] || 20,
      }
    }
    const targetPosition =
      offset > 0
        ? nextTabPosition - tabPositions[currentView]
        : prevTabPosition - tabPositions[currentView]

    const targetWidth =
      offset >= 0 ? nextTabWidth - tabWidths[currentView] : prevTabWidth - tabWidths[currentView]

    const nextColor =
      offset > 0
        ? views[currentView + 1]?.activeColor || views[currentView].activeColor
        : views[currentView - 1]?.activeColor || views[currentView].activeColor

    const backgroundColor = interpolateColor(
      Math.abs(offset),
      [0, 1],
      [views[currentView].activeColor, nextColor],
    )

    return {
      transform: [
        {
          translateX: indicatorPosition.value + 10 + Math.abs(offset) * targetPosition,
        },
      ],
      backgroundColor,
      width: (tabWidths[currentView] || 20) - 20 + Math.abs(offset) * targetWidth,
    }
  })

  return (
    <ThemedBlurView
      style={[
        styles.tabContainer,
        {
          top: headerHeight - StyleSheet.hairlineWidth,
        },
      ]}
      className="border-system-fill/60 border-b"
    >
      <ScrollView
        showsHorizontalScrollIndicator={false}
        className="border-tertiary-system-background"
        horizontal
        ref={tabRef}
        contentContainerStyle={styles.tabScroller}
        style={styles.root}
      >
        {views.map((view, index) => {
          const isSelected = currentView === view.view
          return (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setCurrentView(view.view)}
              key={view.name}
              className="mr-4 flex-row items-center justify-center"
              onLayout={(event) => {
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
              }}
            >
              <view.icon color={isSelected ? view.activeColor : "gray"} height={18} width={18} />
              <Text
                style={{
                  color: isSelected ? view.activeColor : "gray",
                  fontWeight: isSelected ? "medium" : "normal",
                }}
                className="ml-2"
              >
                {view.name}
              </Text>
            </TouchableOpacity>
          )
        })}
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </ScrollView>
    </ThemedBlurView>
  )
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  tabContainer: {
    backgroundColor: "transparent",
    bottom: 0,
    left: 0,
    position: "absolute",
    width: "100%",
    borderTopColor: "rgba(0,0,0,0.2)",
    borderTopWidth: StyleSheet.hairlineWidth,
    height: bottomViewTabHeight,
  },
  tabScroller: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 4,
  },

  root: { paddingHorizontal: 6, borderTopWidth: StyleSheet.hairlineWidth },
})
