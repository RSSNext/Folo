import type { StyleProp, TextProps, TextStyle } from "react-native"
import { Animated, StyleSheet } from "react-native"

type Props = Omit<TextProps, "style"> & {
  tintColor?: string
  children?: string
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>
}

export function FakeNativeHeaderTitle({ style, ...rest }: Props) {
  return (
    <Animated.Text
      accessibilityRole="header"
      aria-level="1"
      numberOfLines={1}
      className={"text-label font-semibold"}
      {...rest}
      style={[styles.title, style]}
    />
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
  },
})
