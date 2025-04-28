package expo.modules.follownative.tabbar

import android.content.Context
import android.util.AttributeSet
import android.widget.LinearLayout

// Custom Horizontal LinearLayout to hold the TabBarPortalViews
class CustomTabBarView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
  // appContext is needed if this view directly interacts with Expo modules/events
  // private val appContext: AppContext
) : LinearLayout(context, attrs, defStyleAttr) {
  var onTabSelectedListener: ((Int) -> Unit)? = null

  init {
    orientation = HORIZONTAL
  }

  fun addTabView(tabPortalView: TabBarPortalView, index: Int) {
    val params = LayoutParams(
      LayoutParams.WRAP_CONTENT,
      LayoutParams.MATCH_PARENT
    )
    tabPortalView.layoutParams = params

    tabPortalView.setOnClickListener {
      onTabSelectedListener?.invoke(index)
    }

    addView(tabPortalView, index)

    updateTabListeners()
  }

  fun removeTabView(index: Int) {
    if (index >= 0 && index < childCount) {
      removeViewAt(index)
      // Re-index remaining listeners
      updateTabListeners()
    }
  }

  private fun updateTabListeners() {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      // Ensure existing listener is removed before adding new one
      child.setOnClickListener(null)
      child.setOnClickListener {
        onTabSelectedListener?.invoke(i)
      }
    }
  }

  // Optional: Add methods to visually update tabs (e.g., selection state)
  fun setTabSelected(index: Int, selected: Boolean) {
    val tabView = getChildAt(index) as? TabBarPortalView
    // TODO: Implement visual change for selection (Maybe depends on the RN component)
    tabView?.alpha = if (selected) 1.0f else 0.7f //This is just a simple example
  }
}
