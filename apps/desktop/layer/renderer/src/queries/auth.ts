import type { AuthSession } from "@follow/shared/hono"
import { clearStorage } from "@follow/utils/ns"
import type { FetchError } from "ofetch"

import { setWhoami } from "~/atoms/user"
import { QUERY_PERSIST_KEY } from "~/constants"
import { useAuthQuery } from "~/hooks/common"
import { getAccountInfo, getSession, signOut as signOutFn } from "~/lib/auth"
import { tipcClient } from "~/lib/client"
import { defineQuery } from "~/lib/defineQuery"
import { clearLocalPersistStoreData } from "~/store/utils/clear"

export const auth = {
  getSession: () => defineQuery(["auth", "session"], () => getSession()),
  getAccounts: () => defineQuery(["auth", "accounts"], () => getAccountInfo()),
}

export const useAccounts = () => {
  return useAuthQuery(auth.getAccounts())
}

export const useSocialAccounts = () => {
  const accounts = useAccounts()
  return {
    ...accounts,
    data: accounts.data?.data?.filter((account) => account.provider !== "credential"),
  }
}

export const useHasPassword = () => {
  const accounts = useAccounts()
  return {
    ...accounts,
    data: !!accounts.data?.data?.find((account) => account.provider === "credential"),
  }
}

export const useSession = (options?: { enabled?: boolean }) => {
  const { data, isLoading, ...rest } = useAuthQuery(auth.getSession(), {
    retry(failureCount, error) {
      const fetchError = error as FetchError

      if (fetchError.statusCode === undefined) {
        return false
      }

      return !!(3 - failureCount)
    },
    enabled: options?.enabled ?? true,
    refetchOnMount: true,
    staleTime: 0,
    meta: {
      persist: true,
    },
  })
  const { error } = rest
  const fetchError = error as FetchError

  return {
    session: data?.data as AuthSession,
    ...rest,
    status: isLoading
      ? "loading"
      : data?.data
        ? "authenticated"
        : fetchError
          ? "error"
          : data?.data === null
            ? "unauthenticated"
            : "unknown",
  }
}

export const handleSessionChanges = () => {
  tipcClient?.sessionChanged()
  window.location.reload()
}

export const signOut = async () => {
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
  await clearLocalPersistStoreData()
  // Sign out
  await tipcClient?.signOut()
  await signOutFn()
  window.location.reload()
}
