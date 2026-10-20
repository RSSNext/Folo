import { useResetTabOpacityWhenFocused } from "@/src/components/layouts/tabbar/hooks"
import { usePrepareEntryRenderWebView } from "@/src/components/native/webview/hooks"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { EntryList } from "@/src/modules/entry-list"
import { EntrySplitView } from "@/src/modules/entry-split/EntrySplitView"

export const IndexTabScreen: TabScreenComponent = () => {
  usePrepareEntryRenderWebView()
  useResetTabOpacityWhenFocused()

  return (
    <EntrySplitView>
      <EntryList />
    </EntrySplitView>
  )
}
