import type { TextProps } from "react-native"
import { Platform, StyleSheet, Text } from "react-native"

export const MonoText = ({
  ref,
  ...props
}: TextProps & {
  ref?: React.Ref<Text | null>
}) => {
  return <Text ref={ref} {...props} style={StyleSheet.flatten([props.style, styles.mono])} />
}
const styles = StyleSheet.create({
  mono: {
    fontFamily: Platform.select({
      ios: "Menlo-Regular",
      android: "monospace",
    }),
  },
})
