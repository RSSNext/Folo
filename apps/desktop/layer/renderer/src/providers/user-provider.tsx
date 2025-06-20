import { UserRole } from "@follow/constants"
import { getStorageNS } from "@follow/utils/ns"
import { useEffect } from "react"
import { toast } from "sonner"

import { setUserRole, setUserRoleEndDate, setWhoami } from "~/atoms/user"
import { setIntegrationIdentify } from "~/initialize/helper"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal"
import { useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()

  const settingModalPresent = useSettingModal()

  useEffect(() => {
    if (!session?.user) return
    setWhoami(session.user)

    // @ts-expect-error FIXME
    setIntegrationIdentify(session.user)
  }, [session?.user])

  const roleEndDate = session?.roleEndDate
    ? typeof session.roleEndDate === "string"
      ? new Date(session.roleEndDate)
      : session.roleEndDate
    : undefined

  useEffect(() => {
    if (!session?.role) return

    if (session.role) {
      setUserRole(session.role as UserRole)
    }

    if (roleEndDate) {
      setUserRoleEndDate(roleEndDate)
    }

    const isToastDismissed = localStorage.getItem(getStorageNS("pro-preview-toast-dismissed"))
    if (session.role && session.role !== UserRole.User && !isToastDismissed) {
      toast.info(
        session.role === UserRole.Trial
          ? "You are currently on a trial plan. Some features may be limited."
          : session.role === UserRole.Preview
            ? `You are currently on a preview plan.${roleEndDate ? ` It will end on ${roleEndDate.toLocaleDateString()}.` : ""}`
            : "",
        {
          duration: Number.POSITIVE_INFINITY,
          action: {
            label: "Check",
            onClick: () => {
              settingModalPresent("referral")
              localStorage.setItem(getStorageNS("pro-preview-toast-dismissed"), "true")
            },
          },
          onDismiss: () => {
            localStorage.setItem(getStorageNS("pro-preview-toast-dismissed"), "true")
          },
        },
      )
    }
  }, [session?.role, roleEndDate?.toString()])

  return null
}
