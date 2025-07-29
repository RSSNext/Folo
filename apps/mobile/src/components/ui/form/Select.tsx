import { cn } from "@follow/utils"
import { useEffect, useMemo, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"
import * as DropdownMenu from "zeego/dropdown-menu"

import { Text } from "@/src/components/ui/typography/Text"
import { MingcuteDownLineIcon } from "@/src/icons/mingcute_down_line"
import { accentColor, useColor } from "@/src/theme/colors"

import { FormLabel } from "./Label"

interface SelectProps<T> {
  options: {
    label: string
    value: T
    subLabel?: string
  }[]
  value: T
  onValueChange: (value: T) => void
  displayValue?: string
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
  disabled?: boolean
}
export function Select<T>({
  options,
  value,
  onValueChange,
  displayValue,
  wrapperClassName,
  wrapperStyle,
  label,
  disabled,
}: SelectProps<T>) {
  const [currentValue, setCurrentValue] = useState(() => value)
  useEffect(() => {
    setCurrentValue(value)
  }, [value])
  const valueToLabelMap = useMemo(() => {
    return options.reduce((acc, option) => {
      acc.set(option.value, option.label)
      return acc
    }, new Map<T, string>())
  }, [options])
  useEffect(() => {
    onValueChange(currentValue)
  }, [])
  const grayColor = useColor("gray")
  const Trigger = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <View
          className={cn(
            "min-w-24 flex-1 shrink flex-row items-center rounded-lg pl-3",
            disabled && "opacity-50",
            wrapperClassName,
          )}
          style={wrapperStyle}
        >
          <Text
            className={cn("text-accent flex-1 text-right font-semibold", disabled && "text-gray")}
            ellipsizeMode="middle"
            numberOfLines={1}
          >
            {displayValue || valueToLabelMap.get(currentValue) || "Select"}
          </Text>
          <View className="ml-auto shrink-0 pl-1">
            <MingcuteDownLineIcon
              color={disabled ? grayColor : accentColor}
              height={18}
              width={18}
            />
          </View>
        </View>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {options.map((option) => {
          const isSelected = currentValue === option.value
          const handleSelect = () => {
            setCurrentValue(option.value)
            onValueChange(option.value)
          }
          return (
            <DropdownMenu.CheckboxItem
              key={option.label}
              value={isSelected}
              onSelect={handleSelect}
            >
              <DropdownMenu.ItemTitle>{option.label}</DropdownMenu.ItemTitle>
              {!!option.subLabel && (
                <DropdownMenu.ItemSubtitle>{option.subLabel}</DropdownMenu.ItemSubtitle>
              )}
            </DropdownMenu.CheckboxItem>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
  if (!label) {
    return Trigger
  }
  return (
    <View className="flex-1 flex-row items-center justify-between">
      <FormLabel className="pl-2" label={label} />
      <View className="flex-1">{Trigger}</View>
    </View>
  )
}
