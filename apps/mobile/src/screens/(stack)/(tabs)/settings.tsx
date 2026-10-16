import { useImageColors } from "@follow/store/image/hooks"
import { useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import { use, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ScrollView } from "react-native"
import { Pressable, StyleSheet, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, { useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BlurEffect } from "@/src/components/common/BlurEffect"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Text } from "@/src/components/ui/typography/Text"
import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"
import { useTabScreenIsFocused } from "@/src/lib/navigation/bottom-tab/hooks"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { isAndroid } from "@/src/lib/platform"
import { BannerStatusBar } from "@/src/modules/settings/BannerStatusBar"
import {
  getSettingsContentMarginTop,
  isUserHeaderGradientLight,
} from "@/src/modules/settings/layout"
import { EditProfileScreen } from "@/src/modules/settings/routes/EditProfile"
import { SettingsList } from "@/src/modules/settings/SettingsList"
import { UserHeaderBanner } from "@/src/modules/settings/UserHeaderBanner"

export function Settings() {
  const insets = useSafeAreaInsets()
  const screenContext = use(ScreenItemContext)
  const whoami = useWhoami()
  const imageColors = useImageColors(whoami?.image)
  const gradientLight = isUserHeaderGradientLight(imageColors)
  const scrollViewRef = useRegisterNavigationScrollView<ScrollView>()
  const isFocused = useTabScreenIsFocused()
  const headerHeight = useDefaultHeaderHeight()
  const contentViewStyle = useMemo(
    () => ({ marginTop: getSettingsContentMarginTop(headerHeight) }),
    [headerHeight],
  )
  return (
    <>
      <SafeNavigationScrollView
        ref={scrollViewRef}
        style={{
          paddingTop: insets.top,
        }}
        className="flex-1 bg-system-grouped-background"
        contentViewClassName="pb-8"
        contentViewStyle={contentViewStyle}
      >
        <UserHeaderBanner
          scrollY={screenContext.reAnimatedScrollY}
          userId={whoami?.id}
          showRoleBadge
        />

        <SettingsList />
      </SafeNavigationScrollView>
      <SettingHeader
        gradientLight={gradientLight}
        headerHeight={headerHeight}
        scrollY={screenContext.reAnimatedScrollY}
      />
      <BannerStatusBar
        gradientLight={gradientLight}
        scrollY={screenContext.reAnimatedScrollY}
        enabled={isFocused}
      />
    </>
  )
}

const SettingHeader = ({
  gradientLight,
  headerHeight,
  scrollY,
}: {
  gradientLight: boolean
  headerHeight: number
  scrollY: SharedValue<number>
}) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const styles = useAnimatedStyle(() => {
    return {
      opacity: scrollY.value / 100,
      height: headerHeight,
      paddingTop: insets.top,
    }
  })
  const whoami = useWhoami()
  return (
    <View
      className="pt-safe absolute inset-x-0 top-0"
      style={{
        height: headerHeight,
      }}
    >
      <Animated.View
        pointerEvents="none"
        className="border-b-hairline absolute inset-x-0 top-0 flex-row items-center border-opaque-separator px-4 pb-2"
        style={styles}
      >
        <BlurEffect />
        <Text className="flex-1 text-center text-[17px] font-semibold text-label">
          {t("tabs.settings")}
        </Text>
      </Animated.View>
      {!!whoami?.id && <EditProfileButton gradientLight={gradientLight} />}
    </View>
  )
}
const EditProfileButton = ({ gradientLight }: { gradientLight: boolean }) => {
  const { t } = useTranslation("common")
  const navigation = useNavigation()
  return (
    <Pressable
      className="absolute bottom-2 right-4 overflow-hidden rounded-full px-3 py-1.5"
      onPress={() => navigation.pushControllerView(EditProfileScreen)}
    >
      {/* Android has no blur, and the opaque fallback hides the label on the banner */}
      {isAndroid ? (
        <View
          style={StyleSheet.absoluteFill}
          className={gradientLight ? "bg-white/50" : "bg-black/30"}
        />
      ) : (
        <BlurEffect />
      )}
      <Text
        className={cn("text-xs font-medium", gradientLight ? "text-black/95" : "text-white/95")}
      >
        {t("words.edit")}
      </Text>
    </Pressable>
  )
}
export const SettingsTabScreen: TabScreenComponent = Settings
