import { composeEventHandlers } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import { use, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { StyleProp, TextInputProps, ViewStyle } from "react-native"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { GroupedCellLabelContext } from "@/src/components/ui/grouped/cell-label-context"
import { Text } from "@/src/components/ui/typography/Text"
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
}: TextInputProps &
  BaseFieldProps & {
    ref?: React.Ref<TextInput | null>
  }) => {
  return (
    <View className="w-full flex-1 gap-1">
      {!!label && <FormLabel className="pl-2.5" label={label} optional={!required} />}
      {!!description && (
        <Text className="mb-1 pl-2.5 text-sm text-secondary-label">{description}</Text>
      )}
      <View
        className={cn(
          "relative h-10 flex-row items-center rounded-lg bg-tertiary-system-fill px-3",
          wrapperClassName,
        )}
        style={wrapperStyle}
      >
        <TextInput
          selectionColor={accentColor}
          ref={ref}
          className={cn("w-full flex-1 p-0 text-label placeholder:text-secondary-label", className)}
          style={StyleSheet.flatten([styles.textField, style])}
          // The label is a separate text, so screen readers would announce an unnamed field
          accessibilityLabel={label}
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
}: TextInputProps &
  BaseFieldProps & {
    ref?: React.Ref<TextInput | null>
  }) => <BaseField {...props} ref={ref} />
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
  NumberFieldProps & {
    ref?: React.Ref<TextInput | null>
  }) => (
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
}: TextInputProps & {
  ref?: React.Ref<TextInput | null>
}) => {
  const secondaryLabelColor = useColor("secondaryLabel")
  const cellLabel = use(GroupedCellLabelContext)
  const [isFocused, setIsFocused] = useState(false)
  const textInputRef = useRef<TextInput>(null)
  useImperativeHandle(ref, () => textInputRef.current!)
  const pressableButtonXSharedValue = useSharedValue(20)
  const pressableButtonOpacity = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: pressableButtonXSharedValue.value,
        },
      ],
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
        // A text alignment gives iOS a paragraph style that word-wraps the unfocused field, which
        // then shows only the part before the last hyphen or space instead of an ellipsis
        lineBreakModeIOS={props.lineBreakModeIOS ?? (props.multiline ? undefined : "tail")}
        // Named after the grouped cell the field sits in, like a switch in such a cell
        accessibilityLabel={props.accessibilityLabel ?? cellLabel}
        ref={textInputRef}
        onChange={props.onChange}
        onChangeText={props.onChangeText}
        onFocus={composeEventHandlers(props.onFocus, () => setIsFocused(true))}
        onBlur={composeEventHandlers(props.onBlur, () => setIsFocused(false))}
        selectionColor={accentColor}
        className={cn("w-full flex-1 text-label placeholder:text-secondary-label", props.className)}
      />

      <Animated.View
        className="ml-2 shrink-0"
        style={{
          width: pressableWidthSharedValue,
        }}
      />
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => {
            textInputRef.current?.clear()
            props.onChangeText?.("")
          }}
        >
          <CloseCircleFillIcon height={16} width={16} color={secondaryLabelColor} />
        </Pressable>
      </Animated.View>
    </View>
  )
}
const styles = StyleSheet.create({
  textField: {
    fontSize: 16,
  },
})
