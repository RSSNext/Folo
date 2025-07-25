import { withOpacity } from "@follow/utils"
import { createElement, use, useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import Animated, { FadeOut } from "react-native-reanimated"

import { Text } from "@/src/components/ui/typography/Text"

import { toastTypeToIcons } from "./constants"
import { ToastActionContext } from "./ctx"
import type { ToastProps } from "./types"

export const CenteredToast = (props: ToastProps) => {
  const renderMessage = props.render ? null : props.message ? (
    <Text className="font-semibold text-white">{props.message}</Text>
  ) : null
  const { register } = use(ToastActionContext)
  useEffect(() => {
    const disposer = register(props.currentIndex, {
      dismiss: async () => {},
    })
    return () => {
      disposer()
    }
  }, [props.currentIndex, register])
  const renderIcon =
    props.icon === false
      ? null
      : (props.icon ?? (
          <View className="mr-2">
            {createElement(toastTypeToIcons[props.type], {
              color: "white",
              height: 20,
              width: 20,
            })}
          </View>
        ))
  const [measureHeight, setMeasureHeight] = useState(-1)
  return (
    <Animated.View
      onLayout={({ nativeEvent }) => {
        setMeasureHeight(nativeEvent.layout.height)
      }}
      exiting={FadeOut}
      style={StyleSheet.flatten([
        styles.toast,
        measureHeight === -1 ? styles.hidden : {},
        measureHeight > 50 ? styles.rounded : styles.roundedFull,
      ])}
    >
      {renderIcon}
      {renderMessage}
    </Animated.View>
  )
}
const styles = StyleSheet.create({
  toast: {
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderColor: withOpacity("#ffffff", 0.3),
    backgroundColor: withOpacity("#000000", 0.9),
  },
  hidden: {
    opacity: 0,
  },
  rounded: {
    borderRadius: 16,
  },
  roundedFull: {
    borderRadius: 9999,
  },
})
