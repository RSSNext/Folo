import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

import type { SwitchProps, SwitchRef } from "../switch/Switch"
import { Switch } from "../switch/Switch"
import { FormLabel } from "./Label"

interface Props {
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
  /** Shown after the label, such as a paid badge */
  labelAccessory?: ReactNode
  description?: string
  size?: "sm" | "default"
}
export const FormSwitch = ({
  ref,
  wrapperClassName,
  wrapperStyle,
  label,
  labelAccessory,
  description,
  size = "default",
  ...rest
}: Props &
  SwitchProps & {
    ref?: React.Ref<SwitchRef | null>
  }) => {
  const Trigger = (
    <Switch
      size={size}
      ref={ref}
      {...rest}
      // The label is a separate text, so screen readers would announce an unnamed switch
      accessibilityLabel={rest.accessibilityLabel ?? label}
    />
  )
  if (!label) {
    return Trigger
  }
  return (
    <View className={"w-full flex-row"}>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1.5 pl-1">
          <FormLabel className="shrink" label={label} optional />
          {labelAccessory}
        </View>
        {!!description && (
          <Text className="mb-1 pl-1 text-sm text-secondary-label">{description}</Text>
        )}
      </View>
      {Trigger}
    </View>
  )
}
