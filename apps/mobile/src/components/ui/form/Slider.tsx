import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

import type { SliderProps, SliderRef } from "../slider/Slider"
import { Slider } from "../slider/Slider"
import { FormLabel } from "./Label"

interface Props {
  wrapperClassName?: string
  wrapperStyle?: StyleProp<ViewStyle>
  label?: string
  description?: string

  /**
   * Display the current value next to the label
   */
  showValue?: boolean

  /**
   * Custom formatter for the displayed value
   */
  valueFormatter?: (value: number) => string
}
export const FormSlider = ({
  ref,
  wrapperClassName,
  wrapperStyle,
  label,
  description,
  showValue = false,
  valueFormatter,
  value = 0,
  ...rest
}: Props &
  SliderProps & {
    ref?: React.Ref<SliderRef | null>
  }) => {
  const SliderComponent = <Slider value={value} ref={ref} {...rest} />
  const formatValue = (val: number) => {
    if (valueFormatter) {
      return valueFormatter(val)
    }
    return val.toFixed(2)
  }
  if (!label) {
    return SliderComponent
  }
  return (
    <View className={wrapperClassName} style={wrapperStyle}>
      <View className="mb-3 flex-row items-center justify-between">
        <FormLabel label={label} optional />
        {showValue && (
          <Text className="text-secondary-label text-sm font-medium">{formatValue(value)}</Text>
        )}
      </View>

      {!!description && <Text className="text-secondary-label mb-3 text-sm">{description}</Text>}

      {SliderComponent}
    </View>
  )
}
