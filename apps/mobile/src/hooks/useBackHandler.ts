import { useEffect } from "react"
import { BackHandler } from "react-native"

import { useCanDismiss, useNavigation } from "../lib/navigation/hooks"
import { isAndroid } from "../lib/platform"

export const useBackHandler = () => {
  const navigation = useNavigation()
  const canDismiss = useCanDismiss()

  useEffect(() => {
    if (!isAndroid) return

    // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener -- listener.remove() handles cleanup
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canDismiss) {
        navigation.dismiss()
        return true
      } else if (navigation.canGoBack()) {
        navigation.back()
        return true
      }
      return false
    })

    return () => {
      listener.remove()
    }
  }, [canDismiss, navigation])
}
