import { cn } from "@follow/utils"
import type {
  LayoutChangeEvent,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native"
import { TextInput, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

export function Header({
  renderLeft,
  renderRight,
  children,
  className,
  style,
  onLayout,
}: {
  renderLeft?: () => React.ReactNode
  renderRight?: () => React.ReactNode
  children?: React.ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  onLayout?: (event: LayoutChangeEvent) => void
}) {
  return (
    <View
      className={cn(
        "border-non-opaque-separator relative min-h-[50px] w-full flex-row items-center justify-center rounded-t-md border-b py-2",
        className,
      )}
      style={style}
      onLayout={onLayout}
    >
      {renderLeft && <View className="absolute left-1">{renderLeft()}</View>}
      {children}
      {renderRight && <View className="absolute right-1">{renderRight()}</View>}
    </View>
  )
}
export function HeaderText({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text className="text-center text-lg font-bold" style={style}>
      {children}
    </Text>
  )
}
export function Input({
  value,
  onChangeText,
  placeholder,
  className,
  style,
  wrapperClassName,
  wrapperStyle,
  ...rest
}: {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  className?: string
  style?: StyleProp<TextStyle>
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
} & TextInputProps) {
  return (
    <View
      className={cn(
        "bg-tertiary-system-fill relative h-10 flex-row items-center rounded-lg px-3",
        wrapperClassName,
      )}
      style={wrapperStyle}
    >
      <TextInput
        className={cn("text-label w-full flex-1 p-0", className)}
        clearButtonMode="always"
        style={style}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        {...rest}
      />
    </View>
  )
}
