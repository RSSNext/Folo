import { cn } from "@follow/utils/src/utils"
import { forwardRef } from "react"
import type { StyleProp, TextInputProps, ViewStyle } from "react-native"
import { StyleSheet, Text, TextInput, View } from "react-native"

import { accentColor } from "@/src/theme/colors"

import { FormLabel } from "./Label"

interface BaseFieldProps {
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
  description?: string
  required?: boolean

  inputPostfixElement?: React.ReactNode
}

const BaseField = forwardRef<TextInput, TextInputProps & BaseFieldProps>(
  (
    {
      className,
      style,
      wrapperClassName,
      wrapperStyle,
      label,
      description,
      required,
      inputPostfixElement,
      ...rest
    },
    ref,
  ) => {
    return (
      <View className="flex-1">
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
  },
)

export const TextField = forwardRef<TextInput, TextInputProps & BaseFieldProps>((props, ref) => (
  <BaseField {...props} ref={ref} />
))

interface NumberFieldProps extends BaseFieldProps {
  value?: number
  onChangeNumber?: (value: number) => void
  defaultValue?: number
}

export const NumberField = forwardRef<
  TextInput,
  Omit<TextInputProps, "keyboardType" | "value" | "onChangeText" | "defaultValue"> &
    NumberFieldProps
>(({ value, onChangeNumber, defaultValue, ...rest }, ref) => (
  <BaseField
    {...rest}
    ref={ref}
    keyboardType="number-pad"
    value={value?.toString()}
    onChangeText={(text) => onChangeNumber?.(Math.min(Number(text), Number.MAX_SAFE_INTEGER))}
    defaultValue={defaultValue?.toString()}
  />
))

const styles = StyleSheet.create({
  textField: {
    fontSize: 16,
  },
})
