import { useWhoami } from "@follow/store/user/hooks"
import { useCallback, useEffect } from "react"
import { ScrollView } from "react-native"

import { HeaderCloseOnly } from "@/src/components/layouts/header/HeaderElements"
import { useSwitchTab } from "@/src/lib/navigation/bottom-tab/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useIsiPad } from "@/src/lib/platform"
import { Login } from "@/src/modules/login"

export const LoginScreen: NavigationControllerView = () => {
  const whoami = useWhoami()
  const switchTab = useSwitchTab()

  const exit = useCallback(() => {
    Navigation.rootNavigation.popToRoot()
  }, [])

  useEffect(() => {
    if (!whoami?.id) {
      return
    }

    switchTab(0)
    const timer = setTimeout(() => {
      exit()
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [exit, switchTab, whoami?.id])
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
