import { useIsNewUser, useWhoami } from "@follow/store/user/hooks"
import { useAtomValueRawSync } from "jotai"
import { selectAtom } from "jotai/utils"
import { useEffect, useMemo, useRef } from "react"

import { useNavigation } from "../lib/navigation/hooks"
import { hasFinishedOnboarding } from "../lib/onboarding"
import { OnboardingScreen } from "../screens/OnboardingScreen"

export function useOnboarding() {
  const whoami = useWhoami()
  const isNewUser = useIsNewUser({ enabled: !!whoami })
  const navigation = useNavigation()
  // The sign-in screen pops to the root shortly after signing in, which would also close an
  // onboarding presented in the meantime, so it waits until nothing is open over the tabs
  const isAtRoot = useAtomValueRawSync(
    useMemo(
      () => selectAtom(navigation.__dangerous_getCtxValue().routesAtom, (r) => r.length === 0),
      [navigation],
    ),
  )
  const hasPresentedRef = useRef(false)
  useEffect(() => {
    async function checkOnboarding() {
      if (hasPresentedRef.current || !isNewUser || !isAtRoot) return
      if (isNewUser && !(await hasFinishedOnboarding())) {
        hasPresentedRef.current = true
        navigation.presentControllerView(OnboardingScreen, undefined, "fullScreenModal")
      }
    }
    checkOnboarding()
  }, [isAtRoot, isNewUser, navigation])
}
