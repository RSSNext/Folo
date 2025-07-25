import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { use, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TextInput, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { ReAnimatedTouchableOpacity } from "@/src/components/common/AnimatedComponents"
import { BlurEffect } from "@/src/components/common/BlurEffect"
import { getDefaultHeaderHeight } from "@/src/components/layouts/utils"
import { SetNavigationHeaderHeightContext } from "@/src/components/layouts/views/NavigationHeaderContext"
import { Search2CuteReIcon } from "@/src/icons/search_2_cute_re"
import { useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { accentColor, useColor } from "@/src/theme/colors"

import { useSearchPageContext, useSearchPageScrollContainerAnimatedX } from "./ctx"
import { SearchTabBar } from "./SearchTabBar"

const DynamicBlurEffect = () => {
  const { reAnimatedScrollY } = use(ScreenItemContext)
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
  const scrollContainerAnimatedX = useSearchPageScrollContainerAnimatedX()
  const { searchFocusedAtom } = useSearchPageContext()
  const isFocused = useAtomValue(searchFocusedAtom)
  const setHeaderHeight = use(SetNavigationHeaderHeightContext)
  return (
    <View
      style={{
        minHeight: headerHeight,
        paddingTop: insets.top,
      }}
      className="relative"
      onLayout={(e) => {
        setHeaderHeight(e.nativeEvent.layout.height)
      }}
    >
      <DynamicBlurEffect />

      <View style={styles.header}>
        <SearchInput />
      </View>
      {isFocused && <SearchTabBar animatedX={scrollContainerAnimatedX} />}
    </View>
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
  const placeholderOpacity = useSharedValue(0)
  const marginRight = useSharedValue(0)
  const cancelButtonTranslateX = useSharedValue(20)
  const [tempSearchValue, setTempSearchValue] = useState(searchValue)
  const focusOrHasValue = isFocused || searchValue || tempSearchValue
  useEffect(() => {
    if (focusOrHasValue) {
      skeletonOpacity.value = withTiming(0, {
        duration: 100,
      })
      skeletonTranslateX.value = withTiming(-150, {
        duration: 100,
        easing: Easing.inOut(Easing.ease),
      })
      placeholderOpacity.value = withTiming(1, {
        duration: 200,
      })
      marginRight.value = withTiming(64, {
        duration: 200,
      })
      cancelButtonTranslateX.value = withTiming(0, {
        duration: 200,
      })
    } else {
      skeletonOpacity.value = withTiming(1, {
        duration: 100,
      })
      skeletonTranslateX.value = withTiming(0, {
        duration: 100,
        easing: Easing.inOut(Easing.ease),
      })
      placeholderOpacity.value = withTiming(0, {
        duration: 200,
      })
      marginRight.value = withTiming(0, {
        duration: 200,
      })
      cancelButtonTranslateX.value = withTiming(20, {
        duration: 200,
      })
    }
  }, [
    focusOrHasValue,
    placeholderOpacity,
    skeletonOpacity,
    skeletonTranslateX,
    marginRight,
    cancelButtonTranslateX,
  ])
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
    transform: [
      {
        translateX: skeletonTranslateX.value,
      },
    ],
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
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    marginRight: marginRight.value,
  }))
  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: cancelButtonTranslateX.value,
      },
    ],
  }))
  useEffect(() => {
    if (!isFocused) {
      inputRef.current?.blur()
    } else {
      inputRef.current?.focus()
    }
  }, [isFocused])
  return (
    <Animated.View className="flex-row items-center justify-center" style={containerAnimatedStyle}>
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
          allowFontScaling={false}
          textAlignVertical="center"
          enterKeyHint="search"
          autoFocus={isFocused}
          ref={inputRef}
          onSubmitEditing={() => {
            setSearchValue(tempSearchValue)
          }}
          defaultValue={searchValue}
          cursorColor={accentColor}
          selectionColor={accentColor}
          style={styles.searchInput}
          className="text-text"
          onFocus={() => setIsFocused(true)}
          onBlur={() => !searchValue && !tempSearchValue && setIsFocused(false)}
          onChangeText={(text) => {
            setTempSearchValue(text)
          }}
        />

        <Animated.View style={skeletonAnimatedStyle} pointerEvents="none">
          <Search2CuteReIcon color={placeholderTextColor} height={18} width={18} />
          <Text
            allowFontScaling={false}
            className="text-secondary-label ml-1"
            style={styles.searchPlaceholderText}
          >
            {t("words.search")}
          </Text>
        </Animated.View>
      </View>

      <ReAnimatedTouchableOpacity
        hitSlop={10}
        onPress={() => {
          setIsFocused(false)
          setSearchValue("")
          setTempSearchValue("")
        }}
        className="absolute -right-20 w-20 pl-4"
        style={cancelButtonAnimatedStyle}
      >
        <Text
          // Fix font scaling issues on Android
          allowFontScaling={false}
          className="text-accent text-[16px] font-medium"
        >
          Cancel
        </Text>
      </ReAnimatedTouchableOpacity>
    </Animated.View>
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
    marginTop: 4,
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
