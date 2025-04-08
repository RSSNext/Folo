import { useAtomValue } from "jotai"
import { useContext, useEffect } from "react"
import type { StackPresentationTypes } from "react-native-screens"
import { useEventCallback } from "usehooks-ts"

import { GroupedNavigationRouteContext } from "./GroupedNavigationRouteContext"
import { NavigationInstanceContext } from "./NavigationInstanceContext"
import { ScreenItemContext } from "./ScreenItemContext"

export const useCanBack = () => {
  const { screenId } = useContext(ScreenItemContext)

  const routeGroups = useContext(GroupedNavigationRouteContext)
  if (!routeGroups) return false

  const routeGroup = routeGroups.find((group) => group.some((r) => r.id === screenId))
  if (!routeGroup) return false

  if (routeGroup.length === 0) return false
  // If routeGroup is M, P, P and current route is P, then we can back

  const firstIsModal = routeGroup.at(0)?.type !== "push"
  const onlyOne = routeGroup.length === 1
  if (firstIsModal && onlyOne) return false
  return true
}

/**
 * If screen present as a modal, then we can dismiss it.
 */
export const useCanDismiss = () => {
  const { screenId } = useContext(ScreenItemContext)

  const routeGroups = useContext(GroupedNavigationRouteContext)
  if (!routeGroups) return false

  const routeGroup = routeGroups.find((group) => group.some((r) => r.id === screenId))
  if (!routeGroup || routeGroup.length === 0) return false

  return routeGroup.at(0)?.type !== "push"
}

export const useNavigation = () => {
  const navigation = useContext(NavigationInstanceContext)
  if (!navigation) {
    throw new Error("Navigation not found")
  }
  return navigation
}

export const useScreenIsInModal = useCanDismiss

const sheetTypes = new Set<StackPresentationTypes>(["formSheet", "modal"])
export const useScreenIsInSheetModal = () => {
  const { screenId } = useContext(ScreenItemContext)

  const routeGroups = useContext(GroupedNavigationRouteContext)
  if (!routeGroups) return false

  const routeGroup = routeGroups.find((group) => group.some((r) => r.id === screenId))
  if (!routeGroup || routeGroup.length === 0) return false
  const first = routeGroup.at(0)
  if (!first) return false
  return sheetTypes.has(first.type)
}

export const useIsSingleRouteInGroup = () => {
  const { screenId } = useContext(ScreenItemContext)

  const routeGroups = useContext(GroupedNavigationRouteContext)
  if (!routeGroups) return false

  const routeGroup = routeGroups.find((group) => group.some((r) => r.id === screenId))
  if (!routeGroup || routeGroup.length === 0) return false
  return routeGroup.length === 1
}

export const useIsTopRouteInGroup = () => {
  const { screenId } = useContext(ScreenItemContext)

  const routeGroups = useContext(GroupedNavigationRouteContext)
  if (!routeGroups) return false
  const routeGroup = routeGroups.find((group) => group.some((r) => r.id === screenId))

  if (!routeGroup || routeGroup.length === 0) return false

  return routeGroup.at(0)?.screenOptions?.id === screenId
}

export const useViewDidAppear = (fn: () => void) => {
  const { isAppearedAtom } = useContext(ScreenItemContext)

  const isAppeared = useAtomValue(isAppearedAtom)

  const fnEvent = useEventCallback(fn)
  useEffect(() => {
    if (isAppeared) {
      fnEvent()
    }
  }, [fnEvent, isAppeared])
}
