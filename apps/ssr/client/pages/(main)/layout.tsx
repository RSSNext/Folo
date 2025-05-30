import { useSyncThemeWebApp } from "@follow/hooks"
import { Outlet } from "react-router"

export const Component = () => {
  useSyncThemeWebApp()
  return <Outlet />
}
