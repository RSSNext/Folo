import { useWhoami } from "@follow/store/user/hooks"
import { use, useEffect } from "react"
import { ScrollView } from "react-native"

import { HeaderCloseOnly } from "@/src/components/layouts/header/HeaderElements"
import { useSwitchTab } from "@/src/lib/navigation/bottom-tab/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useIsiPad } from "@/src/lib/platform"
import { Login } from "@/src/modules/login"

export const LoginScreen: NavigationControllerView = () => {
  const whoami = useWhoami()
  const switchTab = useSwitchTab()
  const { screenId } = use(ScreenItemContext)

  useEffect(() => {
    if (!whoami?.id) {
      return
    }

    switchTab(0)
    const timer = setTimeout(() => {
      // Closes this screen and the steps of signing in opened over it, such as two-factor
      // authentication. What was open under it stays, such as the follow form of a link.
      Navigation.rootNavigation.__internal_dismiss(screenId)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [screenId, switchTab, whoami?.id])
  const isiPad = useIsiPad()
  return (
    <>
      {isiPad ? (
        <ScrollView
          contentContainerStyle={tabletScrollViewContentStyle}
          keyboardShouldPersistTaps="handled"
        >
          <Login />
        </ScrollView>
      ) : (
        <Login />
      )}
      <HeaderCloseOnly />
    </>
  )
}
LoginScreen.sheetGrabberVisible = false

const tabletScrollViewContentStyle = {
  flexGrow: 1,
}
