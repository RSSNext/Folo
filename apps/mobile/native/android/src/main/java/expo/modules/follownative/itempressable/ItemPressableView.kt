package expo.modules.follownative.itempressable

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import android.os.Build
import android.util.TypedValue
import android.view.MotionEvent
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import androidx.core.view.isNotEmpty

class ItemPressableView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  val onItemPress by EventDispatcher()

  private var touchHighlightEnabled: Boolean = true
  private var originalBackground: Drawable? = null
  private var isPressedDown = false

  private var rippleDrawable: RippleDrawable? = null
  private val highlightColor = Color.argb(40, 0, 0, 0)

  init {
    isClickable = true
    isFocusable = true

    originalBackground = background

    setupRipple()
  }

  fun setTouchHighlight(enabled: Boolean) {
    touchHighlightEnabled = enabled
    if (!enabled) {
      foreground = null
    } else {
      setupRipple()
    }
  }

  private fun setupRipple() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && touchHighlightEnabled) {
      val typedValue = TypedValue()
      context.theme.resolveAttribute(android.R.attr.selectableItemBackground, typedValue, true)
      foreground = ContextCompat.getDrawable(context, typedValue.resourceId)

    }
  }

  override fun performClick(): Boolean {
    super.performClick() // Handles accessibility events, sound effects etc.
    onItemPress(emptyMap()) // Dispatch the event (with no arg) to React Native
    return true
  }

  init {
    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (isNotEmpty()) {
      val child = getChildAt(0)
      measureChild(child, widthMeasureSpec, heightMeasureSpec)
      setMeasuredDimension(child.measuredWidth, child.measuredHeight)
    } else {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (isNotEmpty()) {
      val child = getChildAt(0)
      // Layout the child to fill this container
      child.layout(0, 0, r - l, b - t)
    }
  }
}
