import { useEffect } from "react"

import { ModalEventBus } from "../bus"
import type { ModalActionsInternal } from "../context"

/** @internal */
export const useModalSubscriber = (id: string, ctx: ModalActionsInternal) => {
  useEffect(() => {
    return ModalEventBus.subscribe("MODAL_DISPATCH", (data) => {
      if (data.id === id) {
        ctx.dismiss()
      }
    })
  }, [ctx, id])
}
