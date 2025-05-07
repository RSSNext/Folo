import { clsx } from "@follow/utils"
import { cloneElement } from "react"
import { TouchableOpacity } from "react-native"
import { useColor } from "react-native-uikit-colors"

interface ActiionBarItemProps {
  onPress: () => void
  children: React.JSX.Element
  label: string
  disabled?: boolean
  active?: boolean
  iconColor?: string
}
export const ActionBarItem = ({
  onPress,
  children,
  label,
  disabled,
  active,
  iconColor,
}: ActiionBarItemProps) => {
  const labelColor = useColor("label")
  return (
    <TouchableOpacity
      hitSlop={10}
      onPress={onPress}
      accessibilityLabel={label}
      disabled={disabled}
      className={clsx(
        active && "bg-system-fill",
        disabled && "opacity-50",
        "-mt-1.5 rounded-lg p-2",
      )}
    >
      {cloneElement(children, { color: iconColor || labelColor, height: 20, width: 20 })}
    </TouchableOpacity>
  )
}
