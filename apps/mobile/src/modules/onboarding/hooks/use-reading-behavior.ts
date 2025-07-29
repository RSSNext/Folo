import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"

type ReadingBehavior = "radical" | "balanced" | "conservative"

export const useReadingBehavior = () => {
  const markAsReadWhenScrolling = useGeneralSettingKey("scrollMarkUnread")
  const markAsReadWhenInView = useGeneralSettingKey("renderMarkUnread")

  const behavior: ReadingBehavior =
    markAsReadWhenInView && markAsReadWhenScrolling
      ? "radical"
      : !markAsReadWhenInView && !markAsReadWhenScrolling
        ? "conservative"
        : "balanced"

  const updateSettings = (behavior: ReadingBehavior) => {
    switch (behavior) {
      case "radical": {
        setGeneralSetting("scrollMarkUnread", true)
        setGeneralSetting("renderMarkUnread", true)
        break
      }
      case "balanced": {
        setGeneralSetting("scrollMarkUnread", true)
        setGeneralSetting("renderMarkUnread", false)
        break
      }
      case "conservative": {
        setGeneralSetting("scrollMarkUnread", false)
        setGeneralSetting("renderMarkUnread", false)
        break
      }
    }
  }
  return {
    behavior,
    markAsReadWhenScrolling,
    markAsReadWhenInView,
    updateSettings,
  }
}
