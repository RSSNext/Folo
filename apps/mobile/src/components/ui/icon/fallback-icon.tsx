import { getBackgroundGradient, isCJKChar } from "@follow/utils"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useMemo, useState } from "react"
import type { DimensionValue, StyleProp, TextStyle, ViewStyle } from "react-native"
import { StyleSheet, Text, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

export const FallbackIcon = ({
  title,
  url,
  size,
  className,
  style,
  textClassName,
  textStyle,
  gray,
}: {
  title: string
  url?: string
  size: DimensionValue
  className?: string
  style?: StyleProp<ViewStyle>
  textClassName?: string
  textStyle?: StyleProp<TextStyle>
  gray?: boolean
}) => {
  const colors = useMemo(() => getBackgroundGradient(title || url || ""), [title, url])
  const sizeStyle = useMemo(() => ({ width: size, height: size }), [size])

  const [, , , bgAccent, bgAccentLight, bgAccentUltraLight] = colors

  const renderedText = useMemo(() => {
    const isCJK = isCJKChar(title[0]!)
    return (
      <Text style={StyleSheet.flatten([styles.text, textStyle])} className={textClassName}>
        {isCJK ? title[0] : title.slice(0, 2)}
      </Text>
    )
  }, [title, textStyle, textClassName])

  const grayColor = useColor("gray2")

  return (
    <LinearGradient
      className={className}
      colors={
        gray ? [grayColor, grayColor, grayColor] : [bgAccent!, bgAccentLight!, bgAccentUltraLight!]
      }
      locations={[0, 0.99, 1]}
      style={[sizeStyle, styles.container, style]}
    >
      {renderedText}
    </LinearGradient>
  )
}

export const IconWithFallback = (props: {
  url?: string | undefined | null
  size: number
  title?: string
  className?: string
  style?: StyleProp<ViewStyle>
  textClassName?: string
  textStyle?: StyleProp<TextStyle>
}) => {
  const { url, size, title = "", className, style, textClassName, textStyle } = props
  const [hasError, setHasError] = useState(false)

  if (!url || hasError) {
    return (
      <FallbackIcon
        title={title}
        size={size}
        className={className}
        style={style}
        textClassName={textClassName}
        textStyle={textStyle}
      />
    )
  }

  return (
    <View className={className} style={style}>
      <Image
        source={{ uri: url }}
        style={[{ width: size, height: size }]}
        onError={() => setHasError(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    color: "#fff",
  },
})
