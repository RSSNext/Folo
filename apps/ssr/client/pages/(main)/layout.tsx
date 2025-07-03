import { NotFound } from "@client/components/common/404"
import { Outlet } from "react-router"

export const Component = () => {
  if (document.documentElement.dataset.notFound === "true") {
    return <NotFound />
  }
  return <Outlet />
}
