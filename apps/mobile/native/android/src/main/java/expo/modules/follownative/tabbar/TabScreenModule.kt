package expo.modules.follownative.tabbar

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TabScreenModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TabScreen")

    View(TabScreenView::class) {

    }
  }
}
