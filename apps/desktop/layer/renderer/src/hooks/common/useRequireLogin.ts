import { useIsLoggedIn } from "@follow/store/user/hooks"
import { useCallback } from "react"

import { useLoginModal } from "./useLoginModal"

export const useRequireLogin = () => {
  const isLoggedIn = useIsLoggedIn()
  const showLoginModal = useLoginModal()

  const ensureLogin = useCallback(() => {
    if (isLoggedIn) {
      return true
    }
    showLoginModal()
    return false
  }, [isLoggedIn, showLoginModal])

  const withLoginGuard = useCallback(
    <T extends (...args: any[]) => unknown>(action: T) => {
      if (!action) return action

      return ((...args: Parameters<T>) => {
        if (!ensureLogin()) {
          return
        }
        return action(...args)
      }) as T
    },
    [ensureLogin],
  )

  return {
    isLoggedIn,
    ensureLogin,
    withLoginGuard,
    showLoginModal,
  }
}
