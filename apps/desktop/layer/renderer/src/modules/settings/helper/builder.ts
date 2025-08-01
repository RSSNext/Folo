import type { JSX } from "react/jsx-runtime"

import type { SettingItem } from "./setting-builder"
import { createSettingBuilder } from "./setting-builder"

export const createDefineSettingItem =
  <T>(_getSetting: () => T, setSetting: (key: any, value: Partial<T>) => void) =>
  <K extends keyof T>(
    key: K,
    options: {
      label: string
      description?: string | JSX.Element
      onChange?: (value: T[K]) => void
      onAfterChange?: (value: T[K]) => void
      hide?: boolean
    } & Omit<SettingItem<any>, "onChange" | "description" | "label" | "hide" | "key">,
  ): any => {
    const { label, description, onChange, hide, onAfterChange, ...rest } = options

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
      ...rest,
    } as SettingItem<any>
  }

export const createSetting = <T extends object>(
  useSetting: () => T,
  setSetting: (key: any, value: Partial<T>) => void,
) => {
  const SettingBuilder = createSettingBuilder(useSetting)
  const defineSettingItem = createDefineSettingItem(useSetting, setSetting)
  return {
    SettingBuilder,
    defineSettingItem,
  }
}
