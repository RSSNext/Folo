import type {
  AccentColor,
  AISettings,
  GeneralSettings,
  IntegrationSettings,
  UISettings,
} from "./interface"

export enum SettingPaidLevels {
  Free,
  FreeLimited,
  Basic,
}

type PartialRecord<K extends PropertyKey, V> = Partial<Record<K, V>>

export const PAID_SETTINGS = {
  general: {
    summary: SettingPaidLevels.FreeLimited,
    translation: SettingPaidLevels.Basic,
    translationMode: SettingPaidLevels.Basic,
    hidePrivateSubscriptionsInTimeline: SettingPaidLevels.Basic,
  },
  ui: {
    hideExtraBadge: SettingPaidLevels.Basic,
    hideRecentReader: SettingPaidLevels.Basic,
  },
  integration: {
    enableCubox: SettingPaidLevels.Basic,
    enableObsidian: SettingPaidLevels.Basic,
    enableOutline: SettingPaidLevels.Basic,
    enableReadwise: SettingPaidLevels.Basic,
    enableZotero: SettingPaidLevels.Basic,
    enableInstapaper: SettingPaidLevels.Basic,
    enableReadeck: SettingPaidLevels.Basic,
    enableEagle: SettingPaidLevels.Basic,
    enableQBittorrent: SettingPaidLevels.Basic,
    enableCustomIntegration: SettingPaidLevels.Basic,
  },
  ai: {},
} as const satisfies {
  general: PartialRecord<keyof GeneralSettings, SettingPaidLevels>
  ui: PartialRecord<keyof UISettings, SettingPaidLevels>
  integration: PartialRecord<keyof IntegrationSettings, SettingPaidLevels>
  ai: PartialRecord<keyof AISettings, SettingPaidLevels>
}

export type SettingNamespace = keyof typeof PAID_SETTINGS

export const getSettingPaidLevel = (namespace: string, key: string) => {
  const group = PAID_SETTINGS[namespace as keyof typeof PAID_SETTINGS]
  if (!group) return
  return group[key as keyof typeof group]
}

const ACCENT_COLOR_MAP = {
  orange: {
    light: "#FF6B35",
    dark: "#FF5C00",
  },
  blue: {
    light: "#5CA9F2",
    dark: "#2F78E8",
  },
  green: {
    light: "#4CD7A5",
    dark: "#1FA97A",
  },
  purple: {
    light: "#B07BEF",
    dark: "#8A3DCC",
  },
  pink: {
    light: "#F266A8",
    dark: "#C63C82",
  },
  red: {
    light: "#E84A3C",
    dark: "#C22E28",
  },
  yellow: {
    light: "#F7B500",
    dark: "#D99800",
  },
  gray: {
    light: "#8A96A3",
    dark: "#5C6673",
  },
} satisfies Record<string, { light: string; dark: string }>

export const getAccentColorValue = (color: AccentColor) => {
  // If it's a custom color (hex code), return it for both light and dark
  if (color.startsWith("#")) {
    return { light: color, dark: color }
  }
  const preset = ACCENT_COLOR_MAP[color as keyof typeof ACCENT_COLOR_MAP]
  return preset || ACCENT_COLOR_MAP.orange
}
