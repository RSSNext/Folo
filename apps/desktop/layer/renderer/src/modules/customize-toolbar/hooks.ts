import type { UniqueIdentifier } from "@dnd-kit/core"
import { useMemo } from "react"

import { useUISettingSelector } from "~/atoms/settings/ui"

import { DEFAULT_ACTION_ORDER, entryItemHideInHeader } from "./constant"

export const useActionOrder = () => {
  const actionOrderSetting = useUISettingSelector((s) => s.toolbarOrder)
  return useMemo(() => {
    const { main, more } = actionOrderSetting
    const missingMainActions = DEFAULT_ACTION_ORDER.main.filter(
      (id) => !main.includes(id) && !more.includes(id),
    )
    const missingMoreActions = DEFAULT_ACTION_ORDER.more.filter(
      (id) => !main.includes(id) && !more.includes(id),
    )

    return {
      main: [...actionOrderSetting.main, ...missingMainActions].filter(
        (id) => !entryItemHideInHeader.has(id as string),
      ),
      more: [...actionOrderSetting.more, ...missingMoreActions].filter(
        (id) => !entryItemHideInHeader.has(id as string),
      ),
    }
  }, [actionOrderSetting])
}

export const useToolbarOrderMap = () => {
  const actionOrder = useActionOrder()

  const actionOrderMap = useMemo(() => {
    const actionOrderMap = new Map<
      UniqueIdentifier,
      {
        type: "main" | "more"
        order: number
      }
    >()
    actionOrder.main.forEach((id, index) =>
      actionOrderMap.set(id, {
        type: "main",
        order: index,
      }),
    )
    actionOrder.more.forEach((id, index) =>
      actionOrderMap.set(id, {
        type: "more",
        order: index,
      }),
    )
    return actionOrderMap
  }, [actionOrder])
  return actionOrderMap
}
