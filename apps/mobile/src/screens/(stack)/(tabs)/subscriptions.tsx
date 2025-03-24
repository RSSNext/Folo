import type { FeedViewType } from "@follow/constants"
import { useMemo } from "react"
import { View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { BlackBoard2CuteFiIcon } from "@/src/icons/black_board_2_cute_fi"
import { BlackBoard2CuteReIcon } from "@/src/icons/black_board_2_cute_re"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { EntryListContext } from "@/src/modules/screen/atoms"
import { PagerList } from "@/src/modules/screen/PageList"
import { TimelineSelectorProvider } from "@/src/modules/screen/TimelineSelectorProvider"
import { SubscriptionList } from "@/src/modules/subscription/SubscriptionLists"
import { useWhoami } from "@/src/store/user/hooks"

export default function Subscriptions() {
  const whoami = useWhoami()
  const systemGroupedBackground = useColor("systemGroupedBackground")

  return (
    <EntryListContext.Provider value={useMemo(() => ({ type: "subscriptions" }), [])}>
      <TimelineSelectorProvider>
        {whoami ? (
          <PagerList
            renderItem={renderItem}
            style={{
              backgroundColor: systemGroupedBackground,
            }}
          />
        ) : (
          <NoLoginInfo target="subscriptions" />
        )}
      </TimelineSelectorProvider>
    </EntryListContext.Provider>
  )
}

export const SubscriptionsTabScreen: TabScreenComponent = Subscriptions
SubscriptionsTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? BlackBoard2CuteReIcon : BlackBoard2CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

SubscriptionsTabScreen.title = "Subscriptions"

const renderItem = (view: FeedViewType, active: boolean) => (
  <View key={view}>
    <SubscriptionList view={view} active={active} />
  </View>
)
