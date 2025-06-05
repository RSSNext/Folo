import { NotFound } from "@client/components/common/404"
import { useSyncThemeWebApp } from "@follow/hooks"
import { Outlet } from "react-router"

export const Component = () => {
  useSyncThemeWebApp()
  if (document.documentElement.dataset.notFound === "true") {
    return <NotFound />
  }
  return <Outlet />
}
