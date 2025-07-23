import { cn } from "@follow/utils"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"

import type { UsePullUpToNextReturn } from "./types"

/**
 * Component that handles pulling up to navigate to the next unread entry
 */
export const PullUpIndicatorIos: UsePullUpToNextReturn["EntryPullUpToNext"] = ({
  active,
  hide = false,
}) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const textColor = useColor("secondaryLabel")
  const iconColor = useColor("label")

  return (
    <View
      className={cn(
        "absolute bottom-0 flex w-full translate-y-full flex-row items-center justify-center gap-2 pt-4 transition-all duration-200",
        hide ? "opacity-0" : "opacity-100",
      )}
      style={{ paddingBottom: insets.bottom + 20 }}
    >
      <View
        className={cn(
          "flex flex-row items-center gap-2 transition-all duration-200",
          active ? "opacity-50" : "opacity-80",
        )}
      >
        <View
          className={cn(
            "rotate-90 transition-all duration-200",
            active ? "opacity-0" : "opacity-100",
          )}
        >
          <ArrowLeftCuteReIcon width={16} height={16} color={iconColor} />
        </View>
        <Text style={{ color: textColor }}>
          {active ? t("entry.release_to_next_entry") : t("entry.pull_up_to_next_entry")}
        </Text>
      </View>
    </View>
  )
}
