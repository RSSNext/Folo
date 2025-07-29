import type { AuthSession } from "@follow/shared/hono"
import { whoamiQueryKey } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { tracker } from "@follow/tracker"
import { clearStorage } from "@follow/utils/ns"
import type { FetchError } from "ofetch"

import { QUERY_PERSIST_KEY } from "~/constants"
import { useAuthQuery } from "~/hooks/common"
import { deleteUserCustom as deleteUserFn, getAccountInfo, signOut as signOutFn } from "~/lib/auth"
import { ipcServices } from "~/lib/client"
import { defineQuery } from "~/lib/defineQuery"
import { clearLocalPersistStoreData } from "~/store/utils/clear"

export const auth = {
  getSession: () => defineQuery(whoamiQueryKey, () => userSyncService.whoami()),
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
    session: data as AuthSession,
    ...rest,
    status: isLoading
      ? "loading"
      : data
        ? "authenticated"
        : fetchError
          ? "error"
          : data === null
            ? "unauthenticated"
            : "unknown",
  } as const
}

export const handleSessionChanges = () => {
  ipcServices?.auth.sessionChanged()
  window.location.reload()
}

export const signOut = async () => {
  // Clear query cache
  localStorage.removeItem(QUERY_PERSIST_KEY)

  // clear local store data
  await clearLocalPersistStoreData()

  // Clear local storage
  clearStorage()
  // Sign out
  await tracker.manager.clear()
  await ipcServices?.auth.signOut()
  await signOutFn()
  window.location.reload()
}

export const deleteUser = async ({ TOTPCode }: { TOTPCode?: string }) => {
  if (!TOTPCode) {
    return
  }
  await deleteUserFn({
    TOTPCode,
  })
  await signOut()
}
