import { useEffect } from "react"
import { BackHandler } from "react-native"

import { useLightboxControls } from "../components/ui/lightbox/lightboxState"
import { Dialog } from "../lib/dialog"
import { jotaiStore } from "../lib/jotai"
import { useCanDismiss, useNavigation } from "../lib/navigation/hooks"
import {
  confirmLeaveWithUnsavedChanges,
  screenHasUnsavedChanges,
} from "../lib/navigation/unsaved-changes"
import { isAndroid } from "../lib/platform"

export const useBackHandler = () => {
  const navigation = useNavigation()
  const canDismiss = useCanDismiss()
  const { closeLightbox } = useLightboxControls()

  useEffect(() => {
    if (!isAndroid) return

    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      const lightboxWasActive = closeLightbox()
      if (lightboxWasActive) {
        return true
      }
      // An open dialog closes before the screen under it goes back
      if (Dialog.dismissTop()) {
        return true
      }
      const leave = canDismiss
        ? () => navigation.dismiss()
        : navigation.canGoBack()
          ? () => navigation.back()
          : null
      if (!leave) return false

      // A form with unsaved changes asks first, as the swipe and the header button do
      const topRoute = jotaiStore.get(navigation.__dangerous_getCtxValue().routesAtom).at(-1)
      if (topRoute && screenHasUnsavedChanges(topRoute.id)) {
        confirmLeaveWithUnsavedChanges(leave)
      } else {
        leave()
      }
      return true
    })

    return () => {
      listener.remove()
    }
  }, [canDismiss, closeLightbox, navigation])
}
