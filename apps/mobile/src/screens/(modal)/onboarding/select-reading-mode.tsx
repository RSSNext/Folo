import { cn } from "@follow/utils"
import type { PropsWithChildren } from "react"
import { Pressable, Text, View } from "react-native"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { GroupedInsetListNavigationLinkIcon } from "@/src/components/ui/grouped/GroupedList"
import { Eye2CuteReIcon } from "@/src/icons/eye_2_cute_re"
import { Grid2CuteReIcon } from "@/src/icons/grid_2_cute_re"
import { PowerIcon } from "@/src/icons/power"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useReadingBehavior } from "@/src/modules/onboarding/hooks/use-reading-behavior"

export const SelectReadingModeScreen: NavigationControllerView = () => {
  const { behavior, updateSettings } = useReadingBehavior()

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Select Reading Mode" />

      <View className="mt-8 flex w-full gap-4">
        <Card
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#F87181">
              <PowerIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          isSelected={behavior === "radical"}
          onPress={() => {
            updateSettings("radical")
          }}
        >
          <Text className="text-label">
            Radical: Automatically mark entries as read when displayed
          </Text>
        </Card>

        <Card
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#34D399">
              <Grid2CuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          isSelected={behavior === "balanced"}
          onPress={() => {
            updateSettings("balanced")
          }}
        >
          <Text className="text-label">
            Balanced: Automatically mark entries as read when scrolled out of view
          </Text>
        </Card>

        <Card
          icon={
            <GroupedInsetListNavigationLinkIcon backgroundColor="#CBAD6D">
              <Eye2CuteReIcon color="#fff" width={40} height={40} />
            </GroupedInsetListNavigationLinkIcon>
          }
          isSelected={behavior === "conservative"}
          onPress={() => {
            updateSettings("conservative")
          }}
        >
          <Text className="text-label">Conservative: Mark entries as read only when clicked</Text>
        </Card>
      </View>
    </SafeNavigationScrollView>
  )
}

const Card = ({
  children,
  onPress,
  icon,
  isSelected,
}: PropsWithChildren<{
  icon?: React.ReactNode
  onPress?: () => void
  isSelected?: boolean
}>) => {
  return (
    <Pressable
      className={cn(
        "bg-secondary-system-grouped-background mx-4 flex flex-row items-center gap-2 rounded-xl p-4",
        "border-2 border-transparent",
        isSelected && "border-accent border-2",
      )}
      onPress={onPress}
    >
      {icon}
      <View className="flex flex-1 flex-col gap-2">{children}</View>
    </Pressable>
  )
}
