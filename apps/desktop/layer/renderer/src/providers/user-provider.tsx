import { UserRole, UserRoleName } from "@follow/constants"
import { getStorageNS } from "@follow/utils/ns"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"

import { setIntegrationIdentify } from "~/initialize/helper"
import { useSettingModal } from "~/modules/settings/modal/useSettingModal"
import { useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()

  const settingModalPresent = useSettingModal()

  useEffect(() => {
    if (!session?.user) return
    // @ts-expect-error FIXME
    setIntegrationIdentify(session.user)
  }, [session?.user])

  const roleEndDate = useMemo(
    () =>
      session?.roleEndAt
        ? typeof session.roleEndAt === "string"
          ? new Date(session.roleEndAt)
          : session.roleEndAt
        : undefined,
    [session?.roleEndAt],
  )
  useEffect(() => {
    if (!session?.role) return

    const itemKey = getStorageNS("pro-preview-toast-dismissed")

    const isToastDismissed = localStorage.getItem(itemKey)

    const sessionRole = session.role as string

    if (sessionRole && sessionRole !== UserRole.Pro && !isToastDismissed) {
      const message =
        sessionRole === UserRole.Free || sessionRole === UserRole.Trial
          ? `You are currently on the ${UserRoleName[UserRole.Free]} plan. Some features may be limited.`
          : sessionRole === UserRole.PreProTrial
            ? `You are currently on the ${UserRoleName[UserRole.PreProTrial]} plan.${roleEndDate ? ` It will end on ${roleEndDate.toLocaleDateString()}.` : ""}`
            : ""
      if (!message) {
        localStorage.setItem(itemKey, "true")
        return
      }
      toast.warning(message, {
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: "More",
          onClick: () => {
            settingModalPresent("plan")
            localStorage.setItem(itemKey, "true")
          },
        },
        onDismiss: () => {
          localStorage.setItem(itemKey, "true")
        },
      })
    }
  }, [roleEndDate, session?.role, settingModalPresent])

  return null
}
