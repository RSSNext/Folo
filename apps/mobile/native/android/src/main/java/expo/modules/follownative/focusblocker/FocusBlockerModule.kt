package expo.modules.follownative.focusblocker

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FocusBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FocusBlocker")

    View(FocusBlockerView::class) {
    }
  }
}
