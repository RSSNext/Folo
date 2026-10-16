package expo.modules.follownative.focusblocker

import android.content.Context
import android.view.View.MeasureSpec
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Keeps its children from taking focus. When the focused view goes away, e.g. the input of a
 * closing screen, Android moves focus to the first view that can take it, and a WebView that
 * takes it also takes over the keyboard.
 */
class FocusBlockerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  init {
    descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
  }

  // React Native measures and lays out the children, as in its own view groups
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // No-op: React Native has already placed the children
  }
}
