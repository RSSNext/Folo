import type { NativeSyntheticEvent } from "react-native"
import type { ContextMenuOnPressNativeEvent } from "react-native-context-menu-view"
import ContextMenu from "react-native-context-menu-view"

interface DropdownMenuAction<T> {
  title: string
  actions?: DropdownMenuAction<T>[]
  selected?: boolean
}

interface DropdownMenuSelector<T> {
  label: string
  value: T
}

export function DropdownMenu<T>({
  options,
  currentValue,
  handleChangeValue,
  handlePress,
  children,
}: {
  options: DropdownMenuSelector<T>[] | DropdownMenuAction<T>[]
  currentValue?: T
  handleChangeValue?: (value: T) => void
  handlePress?: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  children: React.ReactNode
}) {
  const isActionMenu = options.every((option) => "title" in option)
  return (
    <ContextMenu
      style={{ flex: 1 }}
      dropdownMenuMode
      actions={
        isActionMenu
          ? options
          : options.map((option) => ({
              title: option.label,
              selected: option.value === currentValue,
              disabled: option.value === currentValue,
            }))
      }
      onPress={(e) => {
        if (!isActionMenu) {
          const { index } = e.nativeEvent
          handleChangeValue?.(options[index]!.value)
        }
        handlePress?.(e)
      }}
    >
      {children}
    </ContextMenu>
  )
}
