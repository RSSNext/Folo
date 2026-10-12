import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { useIsPaymentEnabled } from "@/src/atoms/server-configs"
import { PowerIcon } from "@/src/icons/power"
import { showUpgradeRequiredDialog } from "@/src/modules/dialogs/UpgradeRequiredDialog"
import { accentColor } from "@/src/theme/colors"

/**
 * Marks a feature that needs a paid plan, like the paid badge on desktop. While the plan lacks
 * the feature, pressing the badge says which plan it needs and offers an upgrade.
 */
export const PaidBadge = ({ feature, locked }: { feature: string; locked: boolean }) => {
  const { t } = useTranslation("settings")
  const isPaymentEnabled = useIsPaymentEnabled()
  if (!isPaymentEnabled) {
    return null
  }

  const requirement = t("control.paid_badge.basic_or_higher")
  const icon = <PowerIcon color={accentColor} width={16} height={16} />
  if (!locked) {
    return (
      <View accessible accessibilityLabel={requirement}>
        {icon}
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={requirement}
      hitSlop={12}
      onPress={() => showUpgradeRequiredDialog({ title: feature, message: requirement })}
    >
      {icon}
    </Pressable>
  )
}
