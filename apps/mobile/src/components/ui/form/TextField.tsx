import { composeEventHandlers } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { StyleProp, TextInputProps, ViewStyle } from "react-native"
import { StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { gentleSpringPreset } from "@/src/constants/spring"
import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { accentColor, useColor } from "@/src/theme/colors"

import { FormLabel } from "./Label"

interface BaseFieldProps {
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
  description?: string
  required?: boolean

  inputPostfixElement?: React.ReactNode
}

const BaseField = ({
  ref,
  className,
  style,
  wrapperClassName,
  wrapperStyle,
  label,
  description,
  required,
  inputPostfixElement,
  ...rest
}: TextInputProps & BaseFieldProps & { ref?: React.Ref<TextInput | null> }) => {
  return (
    <View className="w-full flex-1 gap-1">
      {!!label && <FormLabel className="pl-2.5" label={label} optional={!required} />}
      {!!description && (
        <Text className="text-secondary-label mb-1 pl-2.5 text-sm">{description}</Text>
      )}
      <View
        className={cn(
          "bg-tertiary-system-fill relative h-10 flex-row items-center rounded-lg px-3",
          wrapperClassName,
        )}
        style={wrapperStyle}
      >
        <TextInput
          selectionColor={accentColor}
          ref={ref}
          className={cn("text-label placeholder:text-secondary-label w-full flex-1", className)}
          style={StyleSheet.flatten([styles.textField, style])}
          {...rest}
        />
        {inputPostfixElement}
      </View>
    </View>
  )
}

export const TextField = ({
  ref,
  ...props
}: TextInputProps & BaseFieldProps & { ref?: React.Ref<TextInput | null> }) => (
  <BaseField {...props} ref={ref} />
)

interface NumberFieldProps extends BaseFieldProps {
  value?: number
  onChangeNumber?: (value: number) => void
  defaultValue?: number
}

export const NumberField = ({
  ref,
  value,
  onChangeNumber,
  defaultValue,
  ...rest
}: Omit<TextInputProps, "keyboardType" | "value" | "onChangeText" | "defaultValue"> &
  NumberFieldProps & { ref?: React.Ref<TextInput | null> }) => (
  <BaseField
    {...rest}
    ref={ref}
    keyboardType="number-pad"
    value={value?.toString()}
    onChangeText={(text) => onChangeNumber?.(Math.min(Number(text), Number.MAX_SAFE_INTEGER))}
    defaultValue={defaultValue?.toString()}
  />
)

export const PlainTextField = ({
  ref,
  ...props
}: TextInputProps & { ref?: React.Ref<TextInput | null> }) => {
  const secondaryLabelColor = useColor("secondaryLabel")

  const [isFocused, setIsFocused] = useState(false)
  const textInputRef = useRef<TextInput>(null)
  useImperativeHandle(ref, () => textInputRef.current!)

  const pressableButtonXSharedValue = useSharedValue(20)
  const pressableButtonOpacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: pressableButtonXSharedValue.value }],
      opacity: pressableButtonOpacity.value,
      position: "absolute",
      right: 0,
    }
  })

  const pressableWidthSharedValue = useSharedValue(isFocused ? 20 : 0)

  useEffect(() => {
    if (isFocused) {
      pressableButtonXSharedValue.value = withSpring(0, gentleSpringPreset)
      pressableButtonOpacity.value = withSpring(1, gentleSpringPreset)
      pressableWidthSharedValue.value = withSpring(20, gentleSpringPreset)
    } else {
      pressableButtonXSharedValue.value = withSpring(20, gentleSpringPreset)
      pressableButtonOpacity.value = withSpring(0, gentleSpringPreset)
      pressableWidthSharedValue.value = withSpring(0, gentleSpringPreset)
    }
  }, [isFocused, pressableButtonXSharedValue, pressableButtonOpacity, pressableWidthSharedValue])

  return (
    <View className="flex-1 flex-row items-center">
      <TextInput
        {...props}
        ref={textInputRef}
        onFocus={composeEventHandlers(props.onFocus, () => setIsFocused(true))}
        onBlur={composeEventHandlers(props.onBlur, () => setIsFocused(false))}
        selectionColor={accentColor}
        className={cn("text-label placeholder:text-secondary-label w-full flex-1", props.className)}
      />

      <Animated.View
        className="ml-2 shrink-0"
        style={{
          width: pressableWidthSharedValue,
        }}
      />
      <Animated.View style={animatedStyle}>
        <TouchableWithoutFeedback
          onPress={() => {
            textInputRef.current?.clear()
            props.onChangeText?.("")
          }}
        >
          <CloseCircleFillIcon height={16} width={16} color={secondaryLabelColor} />
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  textField: {
    fontSize: 16,
  },
})
