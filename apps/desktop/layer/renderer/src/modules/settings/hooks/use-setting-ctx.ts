import { useUserRole } from "@follow/store/user/hooks"
import { useMemo } from "react"

import { useIsInMASReview, useServerConfigs } from "~/atoms/server-configs"

import { getMemoizedSettings } from "../settings-glob"
import type { SettingPageContext } from "../utils"

export const useSettingPageContext = (): SettingPageContext => {
  const role = useUserRole()
  const isInMASReview = useIsInMASReview()
  return useMemo(() => ({ role, isInMASReview }), [role, isInMASReview])
}

export const useAvailableSettings = () => {
  const ctx = useSettingPageContext()
  const serverConfigs = useServerConfigs()
  return useMemo(
    () => getMemoizedSettings().filter((t) => !t.loader.hideIf?.(ctx, serverConfigs)),
    [ctx, serverConfigs],
  )
}
