import { createAtomHooks } from "@follow/utils/jotai"
import { atom, useAtomValueRawSync } from "jotai"
import { selectAtom } from "jotai/utils"
import { useMemo } from "react"
import type { Location, NavigateFunction, Params } from "react-router"
import { shallow } from "zustand/shallow"

interface RouteAtom {
  params: Readonly<Params<string>>
  searchParams: URLSearchParams
  location: Location<any>
}

export const [routeAtom, , , , getReadonlyRoute, setRoute] = createAtomHooks(
  atom<RouteAtom>({
    params: {},
    searchParams: new URLSearchParams(),

    location: {
      pathname: "",
      search: "",
      hash: "",
      state: null,
      key: "",
    },
  }),
)

// `StableRouterProvider` writes the route in a layout effect, after components mounted in the
// same commit (first load, navigating into another layout) rendered the previous one. Jotai v3
// `useAtomValue` would keep that stale value; `useAtomValueRawSync` re-reads it after subscribing.
const noop: [] = []
export const useReadonlyRouteSelector = <T>(
  selector: (route: RouteAtom) => T,
  deps: any[] = noop,
): T =>
  useAtomValueRawSync(
    useMemo(() => selectAtom(routeAtom, (route) => selector(route), shallow), deps),
  )
export const useReadonlyRoute = () => useAtomValueRawSync(routeAtom)

// Vite HMR will create new router instance, but RouterProvider always stable

const [, , , , navigate, setNavigate] = createAtomHooks(
  atom<{ fn: NavigateFunction | null }>({ fn() {} }),
)
const getStableRouterNavigate = () => navigate().fn
export { getStableRouterNavigate, setNavigate }
