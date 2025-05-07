/* eslint-disable @eslint-react/no-array-index-key */
import { cn } from "@follow/utils"
import { Portal } from "@gorhom/portal"
import { Picker } from "@react-native-picker/picker"
import { useMemo, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, Text, View } from "react-native"
import Animated, { SlideOutDown } from "react-native-reanimated"
import { useEventCallback } from "usehooks-ts"

import { MingcuteDownLineIcon } from "@/src/icons/mingcute_down_line"
import { useColor } from "@/src/theme/colors"

import { BlurEffect } from "../../common/BlurEffect"

interface PickerIosProps<T> {
  options: { label: string; value: T }[]

  value: T
  onValueChange: (value: T) => void

  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
}
export function PickerIos<T>({
  options,
  value,
  onValueChange,
  wrapperClassName,
  wrapperStyle,
}: PickerIosProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const [currentValue, setCurrentValue] = useState(() => {
    if (!value) {
      return options[0]!.value
    }
    return value
  })

  const valueToLabelMap = useMemo(() => {
    return options.reduce((acc, option) => {
      acc.set(option.value, option.label)
      return acc
    }, new Map<T, string>())
  }, [options])

  const handleChangeValue = useEventCallback((value: T) => {
    setCurrentValue(value)
    onValueChange(value)
  })

  const systemFill = useColor("text")

  return (
    <>
      {/* Trigger */}
      <Pressable onPress={() => setIsOpen(!isOpen)}>
        <View
          className={cn(
            "border-system-fill/80 bg-system-fill/30 h-10 flex-row items-center rounded-lg border pl-4 pr-2",
            wrapperClassName,
          )}
          style={wrapperStyle}
        >
          <Text className="text-text">{valueToLabelMap.get(currentValue)}</Text>
          <View className="ml-auto shrink-0">
            <MingcuteDownLineIcon color={systemFill} height={16} width={16} />
          </View>
        </View>
      </Pressable>
      {/* Picker */}
      {isOpen && (
        <Portal>
          <Pressable
            onPress={() => setIsOpen(false)}
            className="absolute inset-0 flex flex-row items-end"
          >
            <Animated.View className="relative flex-1" exiting={SlideOutDown}>
              <BlurEffect />
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Picker selectedValue={currentValue} onValueChange={handleChangeValue}>
                  {options.map((option, index) => (
                    <Picker.Item key={index} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Portal>
      )}
    </>
  )
}
