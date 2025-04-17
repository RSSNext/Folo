import { useAtom, useAtomValue, useSetAtom } from "jotai"
import type { FC } from "react"
import { useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Animated as RnAnimated, LayoutChangeEvent } from "react-native"
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { BlurEffect } from "@/src/components/common/BlurEffect"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import { getDefaultHeaderHeight } from "@/src/components/layouts/utils"
import { Search2CuteReIcon } from "@/src/icons/search_2_cute_re"
import { TrendingUpCuteReIcon } from "@/src/icons/trending_up_cute_re"
import { useNavigation, useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import SearchScreen from "@/src/screens/(headless)/search"
import { TrendingScreen } from "@/src/screens/(stack)/trending/TrendingScreen"
import { accentColor, useColor } from "@/src/theme/colors"

import { useSearchPageContext } from "./ctx"
import { DiscoverContext } from "./DiscoverContext"
import { SearchTabBar } from "./SearchTabBar"

export const SearchHeader: FC<{
  animatedX: RnAnimated.Value
  onLayout: (e: LayoutChangeEvent) => void
}> = ({ animatedX, onLayout }) => {
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const sheetModal = useScreenIsInSheetModal()
  const headerHeight = getDefaultHeaderHeight(frame, sheetModal, insets.top)

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

const DynamicBlurEffect = () => {
  const { reAnimatedScrollY } = useContext(ScreenItemContext)
  const blurStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, reAnimatedScrollY.value / 50)),
  }))
  return (
    <Animated.View className="absolute inset-0 flex-1" style={blurStyle} pointerEvents={"none"}>
      <BlurEffect />
    </Animated.View>
  )
}

export const DiscoverHeader = () => {
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const sheetModal = useScreenIsInSheetModal()
  const headerHeight = getDefaultHeaderHeight(frame, sheetModal, insets.top)
  const { headerHeightAtom } = useContext(DiscoverContext)

  const setHeaderHeight = useSetAtom(headerHeightAtom)

  const navigation = useNavigation()
  return (
    <View
      style={{ minHeight: headerHeight, paddingTop: insets.top }}
      className="relative"
      onLayout={(e) => {
        setHeaderHeight(e.nativeEvent.layout.height)
      }}
    >
      <DynamicBlurEffect />

      <View style={styles.header}>
        <PlaceholerSearchBar />
        <UINavigationHeaderActionButton
          onPress={() => navigation.pushControllerView(TrendingScreen)}
        >
          <TrendingUpCuteReIcon color={accentColor} />
        </UINavigationHeaderActionButton>
      </View>
    </View>
  )
}

const PlaceholerSearchBar = () => {
  const labelColor = useColor("secondaryLabel")
  const { t } = useTranslation("common")
  return (
    <Pressable
      style={styles.searchbar}
      className="bg-tertiary-system-fill"
      onPress={() => {
        Navigation.rootNavigation.pushControllerView(SearchScreen)
      }}
    >
      <View
        className="absolute inset-0 flex flex-row items-center justify-center"
        pointerEvents="none"
      >
        <Search2CuteReIcon color={labelColor} height={18} width={18} />
        <Text className="text-secondary-label ml-1" style={styles.searchPlaceholderText}>
          {t("words.search")}
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

          if (Navigation.rootNavigation.canGoBack()) {
            Navigation.rootNavigation.back()
          }
        }}
      >
        <Text className="text-accent ml-3 text-lg font-medium">Cancel</Text>
      </TouchableOpacity>
    </>
  )
}

const SearchInput = () => {
  const { t } = useTranslation("common")
  const { searchFocusedAtom, searchValueAtom } = useSearchPageContext()
  const [isFocused, setIsFocused] = useAtom(searchFocusedAtom)
  const placeholderTextColor = useColor("secondaryLabel")
  const searchValue = useAtomValue(searchValueAtom)
  const setSearchValue = useSetAtom(searchValueAtom)
  const inputRef = useRef<TextInput>(null)

  const skeletonOpacity = useSharedValue(0)
  const skeletonTranslateX = useSharedValue(0)
  const placeholderOpacity = useSharedValue(1)

  const [tempSearchValue, setTempSearchValue] = useState(searchValue)

  const focusOrHasValue = isFocused || searchValue || tempSearchValue

  useEffect(() => {
    if (focusOrHasValue) {
      skeletonOpacity.value = withTiming(0, { duration: 100, easing: Easing.ease })
      skeletonTranslateX.value = withTiming(-150, {
        duration: 100,
        easing: Easing.inOut(Easing.ease),
      })
      placeholderOpacity.value = withTiming(1, { duration: 200, easing: Easing.ease })
    } else {
      skeletonOpacity.value = withTiming(1, { duration: 100, easing: Easing.ease })
      skeletonTranslateX.value = withTiming(0, {
        duration: 100,
        easing: Easing.inOut(Easing.ease),
      })
      placeholderOpacity.value = withTiming(0, { duration: 200, easing: Easing.ease })
    }
  }, [focusOrHasValue, placeholderOpacity, skeletonOpacity, skeletonTranslateX])

  const skeletonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: skeletonTranslateX.value }],
  }))

  const placeholderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,

    position: "absolute",
    top: 0,
    bottom: 0,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }))

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
        <Animated.View style={placeholderAnimatedStyle}>
          <Search2CuteReIcon color={placeholderTextColor} height={18} width={18} />
          {!searchValue && !tempSearchValue && (
            <Text className="text-secondary-label ml-2" style={styles.searchPlaceholderText}>
              {t("words.search")}
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

      <Animated.View style={skeletonAnimatedStyle} pointerEvents="none">
        <Search2CuteReIcon color={placeholderTextColor} height={18} width={18} />
        <Text className="text-secondary-label ml-1" style={styles.searchPlaceholderText}>
          {t("words.search")}
        </Text>
      </Animated.View>
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 14,
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
    height: 40,
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
