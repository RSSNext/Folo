import { cn } from "@follow/utils"
import type { PropsWithChildren } from "react"
import * as React from "react"
import { useMemo } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"

interface GridProps {
  columns: number
  gap: number

  style?: StyleProp<ViewStyle>
  className?: string
}
const placeholder = <View className="flex-1 shrink-0" />
export const Grid = ({
  columns,
  gap,
  children,
  style,
  className,
}: GridProps & PropsWithChildren) => {
  if (columns < 1) {
    throw new Error("Columns must be greater than 0")
  }
  const rowsChildren = useMemo(() => {
    const childrenArray = React.Children.toArray(children)
    const rows = []
    for (let i = 0; i < childrenArray.length; i += columns) {
      const row = childrenArray.slice(i, i + columns)

      // Fill row if columns is greater than row length
      if (row.length < columns) {
        row.push(...Array.from({ length: columns - row.length }, () => placeholder))
      }
      rows.push(row)
    }
    return rows
  }, [children, columns])
  return (
    <View className={cn("w-full flex-1", className)} style={[{ gap }, style]}>
      {rowsChildren.map((row, index) => (
        <View key={index} className="flex flex-row" style={{ gap }}>
          {row.map((child, index) => (
            <View key={index} className="flex-1 shrink-0">
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
