import { useMemo } from "react"

import { useIsInMASReview } from "~/atoms/server-configs"
import { useUserRole } from "~/atoms/user"

import { getMemoizedSettings } from "../settings-glob"
import type { SettingPageContext } from "../utils"

export const useSettingPageContext = (): SettingPageContext => {
  const role = useUserRole()
  const isInMASReview = useIsInMASReview()
  return useMemo(() => ({ role, isInMASReview }), [role, isInMASReview])
}

export const useAvailableSettings = () => {
  const ctx = useSettingPageContext()
  return useMemo(() => getMemoizedSettings().filter((t) => !t.loader.hideIf?.(ctx)), [ctx])
}
