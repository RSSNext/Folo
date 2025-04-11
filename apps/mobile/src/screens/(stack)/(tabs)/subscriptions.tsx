import type { FeedViewType } from "@follow/constants"
import { useMemo } from "react"
import { RootSiblingParent } from "react-native-root-siblings"
import { useColor } from "react-native-uikit-colors"

import { ErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { ListErrorView } from "@/src/components/errors/ListErrorView"
import { BlackBoard2CuteFiIcon } from "@/src/icons/black_board_2_cute_fi"
import { BlackBoard2CuteReIcon } from "@/src/icons/black_board_2_cute_re"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { EntryListContext } from "@/src/modules/screen/atoms"
import { PagerList } from "@/src/modules/screen/PageList"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"
import { SubscriptionList } from "@/src/modules/subscription/SubscriptionLists"
import { useWhoami } from "@/src/store/user/hooks"

export default function Subscriptions() {
  const whoami = useWhoami()
  const systemGroupedBackground = useColor("systemGroupedBackground")

  return (
    <EntryListContext.Provider value={useMemo(() => ({ type: "subscriptions" }), [])}>
      <RootSiblingParent>
        <TimelineHeader />
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
      </RootSiblingParent>
    </EntryListContext.Provider>
  )
}

export const SubscriptionsTabScreen: TabScreenComponent = Subscriptions
SubscriptionsTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? BlackBoard2CuteReIcon : BlackBoard2CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

const renderItem = (view: FeedViewType, active: boolean) => (
  <ErrorBoundary fallbackRender={ListErrorView} key={view}>
    <SubscriptionList view={view} active={active} />
  </ErrorBoundary>
)
