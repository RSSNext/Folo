import type { StyleProp, ViewStyle } from "react-native"
import { StyleSheet, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

export function AccordionItem({
  isExpanded,
  children,
  viewKey,
  style,
  wrapperStyle,
  wrapperClassName,
}: {
  isExpanded: SharedValue<boolean>
  children: React.ReactNode
  viewKey: string
  style?: StyleProp<ViewStyle>
  wrapperStyle?: StyleProp<ViewStyle>
  wrapperClassName?: string
  duration?: number
}) {
  const height = useSharedValue(0)

  const derivedHeight = useDerivedValue(() =>
    withSpring(height.value * Number(isExpanded.value), {
      damping: 30,
      stiffness: 100,
    }),
  )
  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
  }))

  return (
    <Animated.View key={`accordionItem_${viewKey}`} style={[styles.animatedView, bodyStyle, style]}>
      <View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height
        }}
        style={[styles.wrapper, wrapperStyle]}
        className={wrapperClassName}
      >
        {children}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "absolute",
    display: "flex",
    flex: 1,
  },
  animatedView: {
    width: "100%",
    overflow: "hidden",
  },
})
