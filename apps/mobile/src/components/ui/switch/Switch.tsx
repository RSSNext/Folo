import { useImperativeHandle } from "react"
import type { SwitchChangeEvent } from "react-native"
import { Platform, StyleSheet, Switch as NativeSwitch } from "react-native"

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
}: SwitchProps & { ref?: React.Ref<SwitchRef | null> }) => {
  const gray4 = useColor("gray4")

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
      style={size === "sm" ? styles.small : styles.default}
      testID={testID}
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
})
