export const SETTING_MODAL_ID = "setting-modal"

export const GUEST_ALLOWED_SETTING_TABS = ["general", "appearance", "about", "shortcuts"] as const

const GUEST_ALLOWED_SETTING_TABS_SET = new Set<string>(GUEST_ALLOWED_SETTING_TABS)

export const isGuestAccessibleSettingTab = (tab?: string | null) => {
  if (!tab) return false
  return GUEST_ALLOWED_SETTING_TABS_SET.has(tab)
}
