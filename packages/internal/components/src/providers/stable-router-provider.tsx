import { setNavigate, setRoute } from "@follow/components/atoms/route.js"
import { useLayoutEffect } from "react"
import type { NavigateFunction } from "react-router"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomRoute {}
export interface GlobalRoute extends CustomRoute {
  navigate: NavigateFunction
}
declare global {
  interface Window {
    router: GlobalRoute
  }
}
window.router = {
  navigate() {},
} as any

/**
 * Why this.
 * Remix router always update immutable object when the router has any changes, lead to the component which uses router hooks re-render.
 * This provider is hold a empty component, to store the router hooks value.
 * And use our router hooks will not re-render the component when the router has any changes.
 * Also it can access values outside of the component and provide a value selector
 */
export const StableRouterProvider = () => {
  const [searchParams] = useSearchParams()
  const params = useParams()
  const nav = useNavigate()
  const location = useLocation()

  // NOTE: This is a hack to expose the navigate function to the window object, avoid to import `router` circular issue.
  useLayoutEffect(() => {
    window.router.navigate = nav
    setRoute({
      params,
      searchParams,
      location,
    })
    setNavigate({ fn: nav })
  }, [searchParams, params, location, nav])

  return null
}
