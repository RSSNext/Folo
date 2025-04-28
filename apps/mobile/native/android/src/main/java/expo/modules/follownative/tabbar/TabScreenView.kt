package expo.modules.follownative.tabbar

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import androidx.core.view.isNotEmpty


class TabScreenView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    if (isNotEmpty()) {
      val child = getChildAt(0)
      child.measure(widthMeasureSpec, heightMeasureSpec)
      setMeasuredDimension(child.measuredWidth, child.measuredHeight)
    } else {
      setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (isNotEmpty()) {
      val child = getChildAt(0)
      child.layout(0, 0, r - l, b - t)
    }
  }
}
