import { RSSHubCategories } from "@follow/constants"
import { getDefaultHeaderHeight } from "@react-navigation/elements"
import { router } from "expo-router"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import type { FC } from "react"
import { useContext, useEffect, useRef, useState } from "react"
import type { LayoutChangeEvent } from "react-native"
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useAnimatedValue,
  View,
} from "react-native"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { BlurEffect } from "@/src/components/common/BlurEffect"
import { TabBar } from "@/src/components/ui/tabview/TabBar"
import { Search2CuteReIcon } from "@/src/icons/search_2_cute_re"
import { accentColor, useColor } from "@/src/theme/colors"

import { RSSHubCategoryCopyMap } from "./copy"
import { useSearchPageContext } from "./ctx"
import { DiscoverContext } from "./DiscoverContext"
import { SearchTabBar } from "./SearchTabBar"

export const SearchHeader: FC<{
  animatedX: Animated.Value
  onLayout: (e: LayoutChangeEvent) => void
}> = ({ animatedX, onLayout }) => {
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const headerHeight = getDefaultHeaderHeight(frame, false, insets.top)

  return (
    <View
      style={{ minHeight: headerHeight, paddingTop: insets.top }}
      className="relative"
      onLayout={onLayout}
    >
      <BlurEffect />
      <View style={styles.header}>
        <ComposeSearchBar />
      </View>
      <SearchTabBar animatedX={animatedX} />
    </View>
  )
}

export const DiscoverHeader = () => {
  return <DiscoverHeaderImpl />
}
const DiscoverHeaderImpl = () => {
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const headerHeight = getDefaultHeaderHeight(frame, false, insets.top)
  const { animatedX, currentTabAtom, headerHeightAtom } = useContext(DiscoverContext)
  const setCurrentTab = useSetAtom(currentTabAtom)
  const setHeaderHeight = useSetAtom(headerHeightAtom)

  return (
    <View
      style={{ minHeight: headerHeight, paddingTop: insets.top }}
      className="relative"
      onLayout={(e) => {
        setHeaderHeight(e.nativeEvent.layout.height)
      }}
    >
      <BlurEffect />
      <View style={styles.header}>
        <PlaceholerSearchBar />
      </View>

      <TabBar
        tabs={RSSHubCategories.map((category) => ({
          name: RSSHubCategoryCopyMap[category],
          value: category,
        }))}
        tabScrollContainerAnimatedX={animatedX}
        onTabItemPress={(index) => {
          setCurrentTab(index)
        }}
      />
    </View>
  )
}

const PlaceholerSearchBar = () => {
  const labelColor = useColor("secondaryLabel")
  return (
    <Pressable
      style={styles.searchbar}
      className="bg-tertiary-system-fill"
      onPress={() => {
        router.push("/search")
      }}
    >
      <View
        className="absolute inset-0 flex flex-row items-center justify-center"
        pointerEvents="none"
      >
        <Search2CuteReIcon color={labelColor} height={18} width={18} />
        <Text className="text-secondary-label ml-1" style={styles.searchPlaceholderText}>
          Search
        </Text>
      </View>
    </Pressable>
  )
}

const ComposeSearchBar = () => {
  const { searchFocusedAtom, searchValueAtom } = useSearchPageContext()
  const setIsFocused = useSetAtom(searchFocusedAtom)
  const setSearchValue = useSetAtom(searchValueAtom)
  return (
    <>
      <SearchInput />

      <TouchableOpacity
        hitSlop={10}
        onPress={() => {
          setIsFocused(false)
          setSearchValue("")

          if (router.canGoBack()) {
            router.back()
          }
        }}
      >
        <Text className="ml-2 text-accent">Cancel</Text>
      </TouchableOpacity>
    </>
  )
}

const SearchInput = () => {
  const { searchFocusedAtom, searchValueAtom } = useSearchPageContext()
  const [isFocused, setIsFocused] = useAtom(searchFocusedAtom)
  const placeholderTextColor = useColor("secondaryLabel")
  const searchValue = useAtomValue(searchValueAtom)
  const setSearchValue = useSetAtom(searchValueAtom)
  const inputRef = useRef<TextInput>(null)

  const skeletonOpacityValue = useAnimatedValue(0)
  const skeletonTranslateXValue = useAnimatedValue(0)
  const placeholderOpacityValue = useAnimatedValue(1)

  const [tempSearchValue, setTempSearchValue] = useState(searchValue)

  const focusOrHasValue = isFocused || searchValue || tempSearchValue

  useEffect(() => {
    if (focusOrHasValue) {
      Animated.timing(skeletonOpacityValue, {
        toValue: 0,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start()
      Animated.timing(skeletonTranslateXValue, {
        toValue: -150,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start()

      Animated.timing(placeholderOpacityValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(skeletonOpacityValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start()

      Animated.timing(skeletonTranslateXValue, {
        toValue: 0,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start()

      Animated.timing(placeholderOpacityValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start()
    }
  }, [focusOrHasValue, skeletonOpacityValue, placeholderOpacityValue, skeletonTranslateXValue])

  useEffect(() => {
    if (!isFocused) {
      inputRef.current?.blur()
    } else {
      inputRef.current?.focus()
    }
  }, [isFocused])

  return (
    <View style={styles.searchbar} className="bg-tertiary-system-fill">
      {focusOrHasValue && (
        <Animated.View
          style={{
            opacity: placeholderOpacityValue,
          }}
          className="absolute inset-y-0 left-3 flex flex-row items-center justify-center"
        >
          <Search2CuteReIcon color={placeholderTextColor} height={18} width={18} />
          {!searchValue && !tempSearchValue && (
            <Text className="text-secondary-label ml-2" style={styles.searchPlaceholderText}>
              Search
            </Text>
          )}
        </Animated.View>
      )}
      <TextInput
        enterKeyHint="search"
        autoFocus={isFocused}
        ref={inputRef}
        onSubmitEditing={() => {
          setSearchValue(tempSearchValue)
          setTempSearchValue("")
        }}
        defaultValue={searchValue}
        cursorColor={accentColor}
        selectionColor={accentColor}
        style={styles.searchInput}
        className="text-text"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={(text) => {
          setTempSearchValue(text)
        }}
      />

      <Animated.View
        style={{
          opacity: skeletonOpacityValue,
          transform: [{ translateX: skeletonTranslateXValue }],
        }}
        className="absolute inset-0 flex flex-row items-center justify-center"
        pointerEvents="none"
      >
        <Search2CuteReIcon color={placeholderTextColor} height={18} width={18} />
        <Text className="text-secondary-label ml-1" style={styles.searchPlaceholderText}>
          Search
        </Text>
      </Animated.View>
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    flex: 1,
    alignItems: "center",
    marginTop: -3,
    flexDirection: "row",
    marginBottom: 6,
    marginHorizontal: 16,
    position: "relative",
  },

  searchbar: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    height: 32,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingRight: 16,
    paddingLeft: 35,
    height: "100%",
  },
  searchPlaceholderText: {
    fontSize: 16,
  },
})
