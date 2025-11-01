import type { SettingNamespace } from "@follow/shared/settings/constants"
import { getSettingPaidLevel } from "@follow/shared/settings/constants"
import type { JSX } from "react/jsx-runtime"

import type { SettingItem } from "./setting-builder"
import { createSettingBuilder } from "./setting-builder"

export const createDefineSettingItem =
  <T>(
    settingNamespace: SettingNamespace,
    _getSetting: () => T,
    setSetting: (key: any, value: Partial<T>) => void,
  ) =>
  <K extends keyof T>(
    key: K,
    options: {
      label: string
      description?: string | JSX.Element
      onChange?: (value: T[K]) => void
      onAfterChange?: (value: T[K]) => void
      hide?: boolean
    } & Omit<SettingItem<any>, "onChange" | "description" | "label" | "hide" | "key" | "paidLevel">,
  ): any => {
    const { label, description, onChange, hide, onAfterChange, ...rest } = options
    const paidLevel = getSettingPaidLevel(settingNamespace, String(key))

    if (hide) return null
    return {
      key,
      label,
      description,
      onChange: (value: any) => {
        try {
          if (onChange) return onChange(value as any)
          setSetting(key, value as any)
        } finally {
          onAfterChange?.(value as any)
        }
      },
      disabled: hide,
      paidLevel,
      ...rest,
    } as SettingItem<any>
  }

export const createSetting = <T extends object>(
  settingNamespace: SettingNamespace,
  useSetting: () => T,
  setSetting: (key: any, value: Partial<T>) => void,
) => {
  const SettingBuilder = createSettingBuilder(useSetting)
  const defineSettingItem = createDefineSettingItem(settingNamespace, useSetting, setSetting)
  return {
    SettingBuilder,
    defineSettingItem,
  }
}
