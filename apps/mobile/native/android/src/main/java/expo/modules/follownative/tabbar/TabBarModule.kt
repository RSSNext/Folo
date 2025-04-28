package expo.modules.follownative.tabbar

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TabBarModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TabBarRoot")

    View(TabBarRootView::class) {
      Prop("selectedIndex") { view: TabBarRootView, index: Int ->
        view.setPage(index, false)
      }

      Events("onTabIndexChange")

      AsyncFunction("switchTab") { view: TabBarRootView, index: Int ->
        Log.d("[Native] switchTab", "Switching to tab index: $index")
        view.setPage(index, true)
      }
    }
  }
}
