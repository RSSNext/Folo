import { clearStorage } from "@follow/utils/ns"
import { useCallback } from "react"

import { setWhoami } from "~/atoms/user"
import { QUERY_PERSIST_KEY } from "~/constants"
import { signOut } from "~/lib/auth"
import { tipcClient } from "~/lib/client"
import { handleSessionChanges } from "~/queries/auth"
import { clearLocalPersistStoreData } from "~/store/utils/clear"

export const useSignOut = () =>
  useCallback(async () => {
    if (window.__RN__) {
      window.ReactNativeWebView?.postMessage("sign-out")
      return
    }

    // Clear query cache
    localStorage.removeItem(QUERY_PERSIST_KEY)

    // setLoginModalShow(true)
    setWhoami(null)

    // Clear local storage
    clearStorage()

    // clear local store data
    await Promise.allSettled([
      clearLocalPersistStoreData(),
      tipcClient?.cleanBetterAuthSessionCookie(),
    ])
    // Sign out
    await signOut().then(() => {
      handleSessionChanges()
    })
  }, [])
