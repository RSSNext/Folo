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
type GridCell = {
  key: string
  node: React.ReactNode
}

type GridRow = {
  key: string
  cells: GridCell[]
}

const createPlaceholderCell = (key: string): GridCell => ({
  key,
  node: <View className="flex-1 shrink-0" />,
})

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
  const rows = useMemo<GridRow[]>(() => {
    const cells: GridCell[] = []
    let fallbackCellIndex = 0

    const appendChild = (child: React.ReactNode) => {
      if (Array.isArray(child)) {
        for (const childItem of child) {
          appendChild(childItem)
        }
        return
      }
      if (child === null || child === undefined) return
      const key =
        React.isValidElement(child) && child.key != null
          ? String(child.key)
          : `cell-${fallbackCellIndex++}`
      cells.push({
        key,
        node: child,
      })
    }

    appendChild(children)

    if (cells.length === 0) return []

    const nextRows: GridRow[] = []
    let placeholderIndex = 0
    for (let start = 0; start < cells.length; start += columns) {
      const rowCells = cells.slice(start, start + columns)
      while (rowCells.length < columns) {
        rowCells.push(createPlaceholderCell(`placeholder-${placeholderIndex++}`))
      }
      nextRows.push({
        key: `row-${rowCells.map((cell) => cell.key).join("-")}`,
        cells: rowCells,
      })
    }
    return nextRows
  }, [children, columns])

  return (
    <View className={cn("w-full flex-1", className)} style={[{ gap }, style]}>
      {rows.map((row) => (
        <View key={row.key} className="flex flex-row" style={{ gap }}>
          {row.cells.map((cell) => (
            <View key={cell.key} className="flex-1 shrink-0">
              {cell.node}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
