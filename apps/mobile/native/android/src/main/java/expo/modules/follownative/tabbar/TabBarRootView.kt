package expo.modules.follownative.tabbar

import android.content.Context
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class TabBarRootView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  override val shouldUseAndroidLayout: Boolean = true

  private val container = FrameLayout(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
  }

  internal val viewPager: ViewPager2 = ViewPager2(context).apply {
    id = View.generateViewId()
    layoutParams = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    )
    offscreenPageLimit = 1
    isUserInputEnabled = false
  }

  private val tabFragments = mutableListOf<TabScreenFragment>()
  private var pagerAdapter: FragmentStateAdapter? = null
  private val onTabIndexChange by EventDispatcher<Map<String, Int>>()

  init {
    super.addView(container)

    container.addView(viewPager)

    setupAdapter()

    viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
      override fun onPageSelected(position: Int) {
        super.onPageSelected(position)
        onTabIndexChange(mapOf("index" to position))
      }
    })
  }

  private fun setupAdapter() {
    val activity = appContext.activityProvider?.currentActivity as? FragmentActivity
    if (activity != null) {
      pagerAdapter = object : FragmentStateAdapter(activity) {
        override fun getItemCount(): Int = tabFragments.size
        override fun createFragment(position: Int): Fragment = tabFragments[position]
      }
      viewPager.adapter = pagerAdapter
    } else {
      Log.e("TabBarRootView", "FragmentActivity is null. Cannot set up ViewPager2 adapter.")
    }
  }

  fun addTabScreenView(screenView: TabScreenView, index: Int) {
    val fragment = TabScreenFragment.newInstance(screenView)
    if (index >= tabFragments.size) {
      tabFragments.add(fragment)
    } else {
      tabFragments.add(index, fragment)
    }
    pagerAdapter?.notifyItemInserted(index)
  }

  fun removeTabScreenView(screenView: TabScreenView) {
    val index = tabFragments.indexOfFirst { it.containsView(screenView) }
    if (index != -1) {
      tabFragments.removeAt(index)
      pagerAdapter?.notifyItemRemoved(index)
    }
  }

  fun addPortalView(portalView: TabBarPortalView) {
    val layoutParams = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      (64 * resources.displayMetrics.density).toInt()
    ).apply {
      gravity = Gravity.BOTTOM
    }

    portalView.layoutParams = layoutParams

    container.addView(portalView)

    viewPager.layoutParams = (viewPager.layoutParams as FrameLayout.LayoutParams).apply {
      bottomMargin = (64 * resources.displayMetrics.density).toInt()
    }
  }

  fun removePortalView(portalView: TabBarPortalView) {
    container.removeView(portalView)
  }

  fun setSelectedIndex(index: Int) {
    if (index >= 0 && index < tabFragments.size) {
      viewPager.setCurrentItem(index, false)
    }
  }

  override fun addView(child: View?, index: Int) {
    if (child is TabScreenView) {
      addTabScreenView(child, index)
    } else if (child is TabBarPortalView) {
      addPortalView(child)
    } else {
      super.addView(child, index)
    }
  }

  override fun removeView(child: View?) {
    if (child is TabScreenView) {
      removeTabScreenView(child)
    } else if (child is TabBarPortalView) {
      removePortalView(child)
    } else {
      super.removeView(child)
    }
  }
}
