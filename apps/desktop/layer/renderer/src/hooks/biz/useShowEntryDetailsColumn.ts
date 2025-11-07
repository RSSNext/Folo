import { getView } from "@follow/constants"

import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export const useShowEntryDetailsColumn = () => {
  const { view } = useRouteParamsSelector((s) => ({
    view: s.view,
  }))

  return !getView(view).wideMode
}
