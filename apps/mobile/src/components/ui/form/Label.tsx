import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

export const FormLabel: FC<
  PropsWithChildren<{
    label: string
    optional?: boolean
    className?: string
    style?: StyleProp<ViewStyle>
  }>
> = ({ label, optional, className, style }) => {
  return (
    <View className={cn("flex-row", className)} style={style}>
      <Text className="font-medium capitalize text-label">{label}</Text>
      {!optional && <Text className="ml-1 align-sub text-red">*</Text>}
    </View>
  )
}
