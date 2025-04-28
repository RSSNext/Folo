package expo.modules.follownative.tabbar

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment

class TabContentFragment : Fragment() {

  var tabScreenView: TabScreenView? = null
  private var viewId: Int = -1

  companion object {
    fun newInstance(view: TabScreenView): TabContentFragment {
      val fragment = TabContentFragment()
      fragment.tabScreenView = view
      return fragment
    }
  }

  override fun onCreateView(
    inflater: LayoutInflater, container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    (tabScreenView?.parent as? ViewGroup)?.removeView(tabScreenView)

    return tabScreenView ?: FrameLayout(requireContext())
  }

  override fun onDestroyView() {
    // tabScreenView = null // Be careful with this if the view should persist
    super.onDestroyView()
  }
}
