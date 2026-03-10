import { useWhoami } from "@follow/store/user/hooks"
import { Fragment, useCallback, useEffect } from "react"
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
  const Container = isiPad ? ScrollView : Fragment
  return (
    <>
      <Container>
        <Login />
      </Container>
      <HeaderCloseOnly />
    </>
  )
}
LoginScreen.sheetGrabberVisible = false
