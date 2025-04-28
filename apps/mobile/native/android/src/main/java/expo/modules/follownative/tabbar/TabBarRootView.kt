package expo.modules.follownative.tabbar

import android.content.Context
import android.util.Log
import android.view.View
import androidx.viewpager2.widget.ViewPager2
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class TabBarRootView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val viewPager: ViewPager2
  private val customTabBar: CustomTabBarView
  private lateinit var pagerAdapter: TabBarPagerAdapter

  private val tabScreenViews = mutableListOf<TabScreenView>()
  private val tabBarPortalViews = mutableListOf<TabBarPortalView>()

  val onTabIndexChange by EventDispatcher()

  private var selectedIndex = 0

  init {
    orientation = VERTICAL

    customTabBar = CustomTabBarView(context /*, appContext */)
    viewPager = ViewPager2(context)
    viewPager.id = generateViewId()

    val tabBarParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    val pagerParams = LayoutParams(LayoutParams.MATCH_PARENT, 0, 1.0f) // Takes remaining space

    customTabBar.layoutParams = tabBarParams
    viewPager.layoutParams = pagerParams

    addView(customTabBar)
    addView(viewPager)

    setupAdapter()
    setupListeners()
  }

  private fun setupAdapter() {
    val activity = appContext.activityProvider?.currentActivity as? FragmentActivity
    if (activity == null) {
      Log.e("TabBarRootView", "Could not get FragmentActivity from AppContext")
      return
    }
    pagerAdapter = TabBarPagerAdapter(activity, tabScreenViews)
    viewPager.adapter = pagerAdapter
  }

  private fun setupListeners() {
    viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
      override fun onPageSelected(position: Int) {
        super.onPageSelected(position)
        if (selectedIndex != position) {
          Log.d("TabBarRootView", "Page selected: $position")
          updateTabBarSelection(selectedIndex, false)
          selectedIndex = position
          updateTabBarSelection(selectedIndex, true)
          // Send event to React Native
          onTabIndexChange(mapOf("index" to position))
        }
      }
    })

    customTabBar.onTabSelectedListener = { index ->
      Log.d("TabBarRootView", "Custom tab tapped: $index")
      if (viewPager.currentItem != index) {
        viewPager.setCurrentItem(index, true) // Smooth scroll
      }
    }
  }

  fun setPage(index: Int, smoothScroll: Boolean = true) {
    if (index >= 0 && index < pagerAdapter.itemCount && viewPager.currentItem != index) {
      Log.d("TabBarRootView", "Setting page programmatically: $index")
      viewPager.setCurrentItem(index, smoothScroll)
      if (!smoothScroll) {
        updateTabBarSelection(selectedIndex, false)
        selectedIndex = index
        updateTabBarSelection(selectedIndex, true)
        // Optionally send event here too if needed immediately
        // onTabIndexChange(mapOf("index" to index))
      }
    }
  }

  private fun updateTabBarSelection(index: Int, isSelected: Boolean) {
    if (index >= 0 && index < customTabBar.childCount) {
      customTabBar.setTabSelected(index, isSelected)
    }
  }


  override fun addView(child: View?, index: Int) {
    if (child is TabScreenView) {
      val insertionIndex = if (index >= 0 && index <= tabScreenViews.size) index else tabScreenViews.size
      tabScreenViews.add(insertionIndex, child)
      if (::pagerAdapter.isInitialized) {
        pagerAdapter.notifyItemInserted(insertionIndex)
        pagerAdapter.notifyItemRangeChanged(insertionIndex, tabScreenViews.size - insertionIndex)
      } else {
        Log.w("TabBarRootView", "Adapter not initialized when adding TabScreenView")
      }

      Log.d("TabBarRootView", "Added TabScreenView at index $insertionIndex. Total: ${tabScreenViews.size}")

    } else if (child is TabBarPortalView) {
      val insertionIndex = if (index >= 0 && index <= tabBarPortalViews.size) index else tabBarPortalViews.size
      tabBarPortalViews.add(insertionIndex, child)
      customTabBar.addTabView(child, insertionIndex)
      Log.d("TabBarRootView", "Added TabBarPortalView at index $insertionIndex. Total: ${tabBarPortalViews.size}")

    } else {
      if (child != viewPager && child != customTabBar) {
        Log.w("TabBarRootView", "Attempted to add unsupported child view type: ${child?.javaClass?.simpleName}")
      } else {
        super.addView(child, index)
      }
    }
  }

  override fun removeView(child: View?) {
    if (child is TabScreenView) {
      val removalIndex = tabScreenViews.indexOf(child)
      if (removalIndex != -1) {
        tabScreenViews.removeAt(removalIndex)
        if (::pagerAdapter.isInitialized) {
          pagerAdapter.notifyItemRemoved(removalIndex)
          pagerAdapter.notifyItemRangeChanged(removalIndex, tabScreenViews.size - removalIndex)
        }
        Log.d("TabBarRootView", "Removed TabScreenView at index $removalIndex. Remaining: ${tabScreenViews.size}")
      }
    } else if (child is TabBarPortalView) {
      val removalIndex = tabBarPortalViews.indexOf(child)
      if (removalIndex != -1) {
        tabBarPortalViews.removeAt(removalIndex)
        customTabBar.removeTabView(removalIndex) // Remove from the actual LinearLayout
        Log.d("TabBarRootView", "Removed TabBarPortalView at index $removalIndex. Remaining: ${tabBarPortalViews.size}")
      }
    } else {
      super.removeView(child)
    }
  }

  override fun removeViewAt(index: Int) {
    // This might be called by React Native's layout system.
    // We need to figure out which list the child belongs to based on the actual child at that index *within this view*.
    // This is complex because RN manages the indices. A safer approach is to rely on removeView(View).
    val child = getChildAt(index)
    if (child != null) {
      removeView(child)
    } else {
      super.removeViewAt(index)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
  }
}
