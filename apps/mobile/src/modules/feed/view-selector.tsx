import type { FeedViewType } from "@follow/constants"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { Grid } from "@/src/components/ui/grid"
import { Text } from "@/src/components/ui/typography/Text"
import { views } from "@/src/constants/views"
import { useColor } from "@/src/theme/colors"

interface Props {
  value: FeedViewType
  onChange?: (value: FeedViewType) => void
  className?: string
  readOnly?: boolean
}
export const FeedViewSelector = ({ value, onChange, className, readOnly }: Props) => {
  const { t } = useTranslation("common")
  const secondaryLabelColor = useColor("secondaryLabel")
  return (
    <Grid columns={views.length} gap={5} className={className}>
      {views.map((view) => {
        const isSelected = +value === +view.view
        return (
          <Pressable
            key={view.name}
            onPress={() => onChange?.(view.view)}
            disabled={readOnly}
            className={readOnly ? "opacity-50" : undefined}
          >
            <View className="flex-1 items-center">
              <view.icon
                color={isSelected ? view.activeColor : secondaryLabelColor}
                height={18}
                width={18}
              />
              <Text
                className={"mt-1 whitespace-nowrap text-[8px] font-medium"}
                style={{
                  color: isSelected ? view.activeColor : secondaryLabelColor,
                }}
              >
                {t(view.name)}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </Grid>
  )
}
