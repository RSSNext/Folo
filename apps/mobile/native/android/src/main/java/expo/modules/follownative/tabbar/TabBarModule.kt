package expo.modules.follownative.tabbar

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

class TabBarModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TabBarRoot")

    View(TabBarRootView::class) {
      Prop("selectedIndex") { view: TabBarRootView, index: Int ->
        view.setSelectedIndex(index)
      }

      Events("onTabIndexChange")
    }

    AsyncFunction("switchTab") { view: TabBarRootView, index: Int ->
      appContext.mainQueue.launch {
        view.setSelectedIndex(index)
      }
    }
  }
}
