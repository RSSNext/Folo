import { useLayoutEffect } from "react"
import { useLocation, useNavigate } from "react-router"

import { showSettings } from "~/modules/settings/modal/use-setting-modal-hack"

// Settings open as a modal over the main view; these routes only describe the tabs. A typed or
// bookmarked settings URL goes to the main view and opens that tab instead of a blank page.
export const Component = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const tab = pathname.split("/").find((segment, index, segments) => {
      return index > 0 && segments[index - 1] === "settings" && !!segment
    })
    navigate("/", { replace: true })
    showSettings(tab)
  }, [navigate, pathname])

  return null
}
