package expo.modules.follownative.tabbar

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TabBarPortalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TabBarPortal")

    View(TabBarPortalView::class) {

    }
  }
}
