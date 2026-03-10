import { useWhoami } from "@follow/store/user/hooks"
import { Fragment, useCallback, useEffect } from "react"
import { Pressable, ScrollView } from "react-native"

import { HeaderCloseOnly } from "@/src/components/layouts/header/HeaderElements"
import { Text } from "@/src/components/ui/typography/Text"
import { useSession } from "@/src/lib/auth"
import { useSwitchTab } from "@/src/lib/navigation/bottom-tab/hooks"
import { useCanDismiss } from "@/src/lib/navigation/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useIsiPad } from "@/src/lib/platform"
import { Login } from "@/src/modules/login"

export const LoginScreen: NavigationControllerView = () => {
  const whoami = useWhoami()
  const { data: session } = useSession()
  const canDismiss = useCanDismiss()
  const switchTab = useSwitchTab()

  const exit = useCallback(() => {
    if (canDismiss) {
      Navigation.rootNavigation.dismiss()
      return
    }

    Navigation.rootNavigation.popToRoot()
  }, [canDismiss])

  useEffect(() => {
    if (!(session?.user?.id || whoami?.id) || __DEV__) {
      return
    }

    switchTab(0)
    const timer = setTimeout(() => {
      exit()
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [exit, session?.user?.id, switchTab, whoami?.id])
  const isiPad = useIsiPad()
  const Container = isiPad ? ScrollView : Fragment
  // For development purposes, we don't want to redirect to the home page automatically
  return (
    <>
      <Container>
        <Login />
      </Container>
      <HeaderCloseOnly />
      {!!whoami?.id && __DEV__ && (
        <Pressable
          className="bottom-safe-offset-8 absolute left-1/2 -translate-x-1/2 flex-row items-center justify-center rounded-xl bg-system-fill p-2 px-4"
          onPress={() => {
            exit()
          }}
        >
          <Text className="text-center font-semibold text-secondary-label">
            Redirect to Home (DEV)
          </Text>
        </Pressable>
      )}
    </>
  )
}
LoginScreen.sheetGrabberVisible = false
