import { t } from "i18next"
import { Alert } from "react-native"

// Modal screens whose form has edits that leaving would drop, by route id
const screensWithUnsavedChanges = new Set<string>()

export const setScreenHasUnsavedChanges = (screenId: string, hasUnsavedChanges: boolean) => {
  if (hasUnsavedChanges) {
    screensWithUnsavedChanges.add(screenId)
  } else {
    screensWithUnsavedChanges.delete(screenId)
  }
}

export const screenHasUnsavedChanges = (screenId: string) => screensWithUnsavedChanges.has(screenId)

/** Asks whether to leave a screen with unsaved changes and calls `leave` if the user agrees */
export const confirmLeaveWithUnsavedChanges = (leave: () => void) => {
  Alert.alert(t("navigation.unsaved_changes.title"), t("navigation.unsaved_changes.description"), [
    {
      text: t("words.cancel", { ns: "common" }),
      style: "cancel",
    },
    {
      text: t("navigation.unsaved_changes.exit"),
      style: "destructive",
      onPress: leave,
    },
  ])
}
