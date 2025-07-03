import { cn } from "@follow/utils/utils"
import { useCallback, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CheckFilledIcon } from "@/src/icons/check_filled"
import { MingcuteDownLineIcon } from "@/src/icons/mingcute_down_line"
import { accentColor } from "@/src/theme/colors"

import { BottomModal } from "../modal/BottomModal"
import { FormLabel } from "./Label"

interface SelectProps<T> {
  options: { label: string; value: T; subLabel?: string }[]
  value: T
  onValueChange: (value: T) => void
  displayValue?: string
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
}

export function Select<T>({
  options,
  value,
  onValueChange,
  displayValue,
  wrapperClassName,
  wrapperStyle,
  label,
}: SelectProps<T>) {
  const [isModalVisible, setModalVisible] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value)
  const insets = useSafeAreaInsets()

  const showOptions = useCallback(() => {
    setModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalVisible(false)
  }, [])

  const handleSelectOption = useCallback(
    (optionValue: T) => {
      onValueChange(optionValue)
      closeModal()
    },
    [onValueChange, closeModal],
  )

  const renderOption = useCallback(
    ({ item }: { item: { label: string; value: T; subLabel?: string } }) => {
      const isSelected = value === item.value

      return (
        <>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectOption(item.value)}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-1">
              <Text
                className={cn("text-label text-base", isSelected ? "font-semibold" : "font-normal")}
              >
                {item.label}
              </Text>
              {item.subLabel ? (
                <Text className="text-secondary-label mt-0.5 text-xs">{item.subLabel}</Text>
              ) : null}
            </View>
            {isSelected && (
              <View className="ml-2">
                <CheckFilledIcon color={accentColor} height={20} width={20} />
              </View>
            )}
          </TouchableOpacity>
          <View
            className={cn("bg-opaque-separator/70 mb-px ml-4")}
            style={{ height: StyleSheet.hairlineWidth }}
          />
        </>
      )
    },
    [handleSelectOption, value],
  )
  const Trigger = (
    <TouchableOpacity
      className={cn(
        "min-w-24 flex-1 shrink flex-row items-center rounded-lg pl-3",

        wrapperClassName,
      )}
      hitSlop={30}
      onPress={showOptions}
      style={wrapperStyle}
    >
      <Text
        className="text-accent flex-1 text-right font-semibold"
        ellipsizeMode="middle"
        numberOfLines={1}
      >
        {displayValue || selectedOption?.label || "Select"}
      </Text>
      <View className="ml-auto shrink-0 pl-1">
        <MingcuteDownLineIcon color={accentColor} height={18} width={18} />
      </View>
    </TouchableOpacity>
  )

  const SelectModal = (
    <BottomModal visible={isModalVisible} onClose={closeModal}>
      <View className="border-b-hairline border-opaque-separator flex-row items-center justify-between p-4">
        <Text className="text-label text-xl font-semibold">Select an option</Text>
        <TouchableOpacity onPress={closeModal}>
          <Text style={{ color: accentColor }} className="text-lg font-bold">
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={options}
        renderItem={renderOption}
        keyExtractor={(item) => String(item.value)}
        className="grow"
        style={{
          marginBottom: insets.bottom + 16,
        }}
      />
    </BottomModal>
  )

  if (!label) {
    return (
      <>
        {Trigger}
        {SelectModal}
      </>
    )
  }

  return (
    <>
      <View className="flex-1 flex-row items-center justify-between">
        <FormLabel className="pl-2" label={label} />
        <View className="flex-1">{Trigger}</View>
      </View>
      {SelectModal}
    </>
  )
}
