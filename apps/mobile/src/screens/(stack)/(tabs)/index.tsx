import { useResetTabOpacityWhenFocused } from "@/src/components/layouts/tabbar/hooks"
import { usePrepareEntryRenderWebView } from "@/src/components/native/webview/hooks"
import { Home5CuteFiIcon } from "@/src/icons/home_5_cute_fi"
import { Home5CuteReIcon } from "@/src/icons/home_5_cute_re"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { EntryList } from "@/src/modules/entry-list"

export const IndexTabScreen: TabScreenComponent = () => {
  usePrepareEntryRenderWebView()
  useResetTabOpacityWhenFocused()
  return <EntryList />
}

IndexTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? Home5CuteReIcon : Home5CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}
