import { use, useImperativeHandle } from "react"
import type { SwitchChangeEvent } from "react-native"
import { Platform, StyleSheet, Switch as NativeSwitch } from "react-native"

import { GroupedCellLabelContext } from "@/src/components/ui/grouped/cell-label-context"
import { accentColor, useColor } from "@/src/theme/colors"

export interface SwitchProps {
  onChange?: ((event: SwitchChangeEvent) => Promise<void> | void) | null | undefined

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ((value: boolean) => Promise<void> | void) | null | undefined

  /**
   * The value of the switch. If true the switch will be turned on.
   * Default value is false.
   */
  value?: boolean | undefined

  size?: "sm" | "default"

  disabled?: boolean | undefined

  testID?: string | undefined

  /** Defaults to the label of the grouped cell the switch sits in */
  accessibilityLabel?: string | undefined
}

export type SwitchRef = {
  value: boolean
}
export const Switch = ({
  ref,
  value = false,
  onValueChange,
  onChange,
  size = "default",
  disabled = false,
  testID,
  accessibilityLabel,
}: SwitchProps & { ref?: React.Ref<SwitchRef | null> }) => {
  const gray4 = useColor("gray4")
  const cellLabel = use(GroupedCellLabelContext)

  useImperativeHandle(
    ref,
    () => ({
      value,
    }),
    [value],
  )

  return (
    <NativeSwitch
      disabled={disabled}
      ios_backgroundColor={gray4}
      onChange={onChange ?? undefined}
      onValueChange={onValueChange ?? undefined}
      style={[
        size === "sm" ? styles.small : styles.default,
        // iOS dims a disabled switch, but Android keeps the custom colors, so it would look enabled
        disabled && Platform.OS === "android" && styles.disabledAndroid,
      ]}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? cellLabel}
      thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
      trackColor={{ false: gray4, true: accentColor }}
      value={value}
    />
  )
}

const styles = StyleSheet.create({
  default: {
    transform: [{ scaleX: 0.94 }, { scaleY: 0.94 }],
  },
  small: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  disabledAndroid: {
    opacity: 0.5,
  },
})
