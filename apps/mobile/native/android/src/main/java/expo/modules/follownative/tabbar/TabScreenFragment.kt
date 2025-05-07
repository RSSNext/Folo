package expo.modules.follownative.tabbar

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity

class TabScreenFragment : Fragment() {
  private var screenView: TabScreenView? = null

  override fun onCreateView(inflater: android.view.LayoutInflater, container: android.view.ViewGroup?, savedInstanceState: android.os.Bundle?): View? {
    if (screenView?.parent != null) {
      (screenView?.parent as? android.view.ViewGroup)?.removeView(screenView)
    }
    return screenView
  }

  fun containsView(view: TabScreenView): Boolean {
    return screenView == view
  }

  companion object {
    fun newInstance(view: TabScreenView): TabScreenFragment {
      val fragment = TabScreenFragment()
      fragment.screenView = view
      return fragment
    }
  }
}
