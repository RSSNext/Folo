import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"

import { useEntryListContext } from "../atoms"

export const headerHideableBottomHeight = 58

export const useHeaderHeight = () => {
  const screenType = useEntryListContext().type
  const originalDefaultHeaderHeight = useDefaultHeaderHeight()
  const headerHeight =
    screenType === "timeline" || screenType === "subscriptions"
      ? originalDefaultHeaderHeight + headerHideableBottomHeight
      : originalDefaultHeaderHeight

  return headerHeight
}
