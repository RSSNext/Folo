package expo.modules.follownative.tabbar

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter

class TabBarPagerAdapter(
  fragmentActivity: FragmentActivity,
  private val tabScreens: MutableList<TabScreenView> // List of RN content views
) : FragmentStateAdapter(fragmentActivity) {

  override fun getItemCount(): Int = tabScreens.size

  override fun createFragment(position: Int): Fragment {
    return TabContentFragment.newInstance(tabScreens[position])
  }

  override fun getItemId(position: Int): Long {
    return tabScreens[position].hashCode().toLong()
  }

  override fun containsItem(itemId: Long): Boolean {
    // Check if a view with this ID still exists in our list
    return tabScreens.any { it.hashCode().toLong() == itemId }
  }

  fun addTabScreen(view: TabScreenView) {
    tabScreens.add(view)
    notifyItemInserted(tabScreens.size - 1)
  }

  fun removeTabScreen(index: Int) {
    if (index >= 0 && index < tabScreens.size) {
      tabScreens.removeAt(index)
      notifyItemRemoved(index)
      // Optional: notifyItemRangeChanged if indices after removal need update
      notifyItemRangeChanged(index, tabScreens.size - index)
    }
  }

  fun getTabScreenView(index: Int): TabScreenView? {
    return tabScreens.getOrNull(index)
  }
}
