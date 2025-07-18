import { Routes } from "@follow/constants"
import { registerGlobalContext } from "@follow/shared/bridge"
import { env } from "@follow/shared/env.desktop"
import { invalidateUserSession } from "@follow/store/user/hooks"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import { toast } from "sonner"

import { setWindowState } from "~/atoms/app"
import { getGeneralSettings } from "~/atoms/settings/general"
import { getUISettings, useToggleZenMode } from "~/atoms/settings/ui"
import { setUpdaterStatus, useUpdaterStatus } from "~/atoms/updater"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useDiscoverRSSHubRouteModal } from "~/hooks/biz/useDiscoverRSSHubRoute"
import { useFollow } from "~/hooks/biz/useFollow"
import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { oneTimeToken } from "~/lib/auth"
import { queryClient } from "~/lib/query-client"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"
import { useSettingModal } from "~/modules/settings/modal/useSettingModal"
import { handleSessionChanges } from "~/queries/auth"
import { clearDataIfLoginOtherAccount } from "~/store/utils/clear"

declare module "@follow/components/providers/stable-router-provider.js" {
  interface CustomRoute {
    showSettings: (path?: string) => void
  }
}

export const ExtensionExposeProvider = () => {
  const { present } = useModalStack()
  const showSettings = useSettingModal()
  const updaterStatus = useUpdaterStatus()
  useEffect(() => {
    registerGlobalContext({
      updateDownloaded() {
        setUpdaterStatus({
          type: "app",
          status: "ready",
        })
      },
    })
  }, [updaterStatus])

  const location = useLocation()

  useEffect(() => {
    registerGlobalContext({
      goToDiscover: () => {
        window.router.navigate(Routes.Discover)
      },
      goToFeed: ({ id, view }: { id: string; view?: number }) => {
        navigateEntry({ feedId: id, view: view ?? 0, backPath: location.pathname })
      },
      goToList: ({ id, view }: { id: string; view?: number }) => {
        navigateEntry({ listId: id, view: view ?? 0, backPath: location.pathname })
      },
    })
  }, [location.pathname])

  useEffect(() => {
    registerGlobalContext({
      showSetting: (path) => window.router.showSettings(path),
      getGeneralSettings,
      getUISettings,

      toast,
      getApiUrl() {
        return env.VITE_API_URL
      },
      getWebUrl() {
        return env.VITE_WEB_URL
      },

      clearIfLoginOtherAccount(newUserId: string) {
        clearDataIfLoginOtherAccount(newUserId)
      },
      async applyOneTimeToken(token: string) {
        await oneTimeToken.apply({ token })
        handleSessionChanges()
      },

      readyToUpdate() {
        setUpdaterStatus({
          type: "renderer",
          status: "ready",
        })
      },
      invalidateQuery(queryKey: string | string[]) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        })
      },
      navigateEntry,
    })
  }, [])
  useEffect(() => {
    // @ts-expect-error
    window.router ||= {}
    window.router.showSettings = showSettings
  }, [showSettings])

  const { t } = useTranslation()

  const follow = useFollow()
  const presentUserProfile = usePresentUserProfileModal("dialog")
  const presentDiscoverRSSHubRoute = useDiscoverRSSHubRouteModal()
  useEffect(() => {
    registerGlobalContext({
      follow,
      profile(id, variant) {
        presentUserProfile(id, variant)
      },
      rsshubRoute(route) {
        presentDiscoverRSSHubRoute(route)
      },
    })
  }, [follow, present, presentDiscoverRSSHubRoute, presentUserProfile, t])

  const toggleZenMode = useToggleZenMode()
  useEffect(() => {
    registerGlobalContext({
      zenMode: toggleZenMode,
    })
  }, [toggleZenMode])

  const dialog = useDialog()
  useEffect(() => {
    registerGlobalContext({
      dialog,
    })
  }, [dialog])

  useBindElectronBridge()

  useEffect(() => {
    registerGlobalContext({
      refreshSession: invalidateUserSession,
    })
  }, [dialog])

  return null
}

const useBindElectronBridge = () => {
  useEffect(() => {
    registerGlobalContext({
      setWindowState,
    })
  }, [])
}
