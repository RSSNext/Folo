import { useDragControls } from "motion/react"
import type { PointerEventHandler, RefObject } from "react"
import { useCallback } from "react"

import { useResizeableModal } from "../hooks"

/**
 * @internal
 */
export const useModalResizeAndDrag = (
  modalElementRef: RefObject<HTMLDivElement | null>,
  {
    resizeable,
    draggable,
  }: {
    resizeable: boolean
    draggable: boolean
  },
) => {
  const dragController = useDragControls()
  const {
    handleResizeStop,
    handleResizeStart,
    relocateModal,
    preferDragDir,
    isResizeable,
    resizeableStyle,
  } = useResizeableModal(modalElementRef, {
    enableResizeable: resizeable,
    dragControls: dragController,
  })

  const handleDrag: PointerEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (draggable) {
        dragController.start(e)
      }
    },
    [dragController, draggable],
  )

  return {
    handleDrag,
    handleResizeStart,
    handleResizeStop,
    relocateModal,
    preferDragDir,
    isResizeable,
    resizeableStyle,

    dragController,
  }
}
