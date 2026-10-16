import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { getIsPaymentEnabled } from "@/src/atoms/server-configs"
import { PaidBadge } from "@/src/components/ui/badge/PaidBadge"
import { GroupedInsetListCell } from "@/src/components/ui/grouped/GroupedList"
import { toast } from "@/src/lib/toast"
import { showUpgradeRequiredDialog } from "@/src/modules/dialogs/UpgradeRequiredDialog"

/**
 * A setting that needs a paid plan, marked with the paid badge as on desktop. While the plan lacks
 * it, the setting reads as its default, its control is disabled, and pressing the row says which
 * plan it needs and offers an upgrade.
 */
export const PaidSettingCell = ({
  label,
  description,
  locked,
  rightClassName,
  children,
}: {
  label: string
  description?: string
  /** Whether the user's plan lacks the setting. The control is disabled meanwhile. */
  locked: boolean
  rightClassName?: string
  children: ReactNode
}) => {
  const { t } = useTranslation("settings")

  const offerUpgrade = () => {
    const requirement = t("control.paid_badge.basic_or_higher")
    if (getIsPaymentEnabled()) {
      showUpgradeRequiredDialog({ title: label, message: requirement })
    } else {
      // The upgrade dialog waits for the server's payment config
      toast.info(requirement)
    }
  }

  return (
    <GroupedInsetListCell
      label={label}
      description={description}
      labelAccessory={<PaidBadge feature={label} locked={locked} />}
      rightClassName={rightClassName}
      onPress={locked ? offerUpgrade : undefined}
    >
      {/* A press on the disabled control reaches the row */}
      <View pointerEvents={locked ? "none" : "auto"}>{children}</View>
    </GroupedInsetListCell>
  )
}
