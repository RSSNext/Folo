package expo.modules.follownative.itempressable

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ItemPressableModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ItemPressable")

    View(ItemPressableView::class) {
      Prop("touchHighlight") { view: ItemPressableView, enabled: Boolean ->
        view.setTouchHighlight(enabled)
      }

      Events("onItemPress")
    }
  }
}
