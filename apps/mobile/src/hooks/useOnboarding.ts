import { isOnboardingFinishedStorageKey } from "@follow/store/user/constants"
import { useIsNewUser, useWhoami } from "@follow/store/user/hooks"
import { useEffect, useRef } from "react"

import { kv } from "../lib/kv"
import { useNavigation } from "../lib/navigation/hooks"
import { OnboardingScreen } from "../screens/OnboardingScreen"

export function useOnboarding() {
  const whoami = useWhoami()
  const isNewUser = useIsNewUser({ enabled: !!whoami })
  const navigation = useNavigation()
  const hasPresentedRef = useRef(false)
  useEffect(() => {
    async function checkOnboarding() {
      if (hasPresentedRef.current || !isNewUser) return
      if (isNewUser && !(await kv.get(isOnboardingFinishedStorageKey))) {
        hasPresentedRef.current = true
        navigation.presentControllerView(OnboardingScreen, undefined, "fullScreenModal")
      }
    }
    checkOnboarding()
  }, [isNewUser, navigation])
}
