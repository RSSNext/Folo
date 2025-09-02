import { Spring } from "@follow/components/constants/spring.js"
import { nextFrame } from "@follow/utils/dom"
import { useAnimationControls } from "motion/react"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { ModalEventBus } from "../bus"
import { modalMontionConfig } from "../constants"

export interface ModalAnimateControls {
  animateController: ReturnType<typeof useAnimationControls>
  playNoticeAnimation: () => void
  playExitAnimation: () => Promise<void>
  isClosing: boolean
  readyToClose: () => void
}

/**
 * @internal
 * Hook for managing modal animations including enter, notice, and exit animations
 */
export const useModalAnimate = (isTop: boolean, modalId: string): ModalAnimateControls => {
  const animateController = useAnimationControls()
  const [isClosing, setIsClosing] = useState(false)
  // Initial enter animation
  useEffect(() => {
    ModalEventBus.subscribe("RE_PRESENT", (data) => {
      if (data.id !== modalId) {
        return
      }
      setIsClosing(false)
      animateController.start(modalMontionConfig.animate)
    })
    nextFrame(() => {
      animateController.start(modalMontionConfig.animate)
    })
  }, [animateController, modalId, setIsClosing])

  // Notice animation for when modal can't be dismissed
  const playNoticeAnimation = useCallback(() => {
    animateController
      .start({
        z: 6,
        transition: Spring.snappy(0.06),
      })
      .then(() => {
        animateController.start({
          z: 0,
        })
      })
  }, [animateController])

  // Stack position animation
  useLayoutEffect(() => {
    if (isTop) return
    animateController.start({
      z: -64,
      rotateX: 2.5,
      y: 8,
    })
    return () => {
      try {
        animateController.stop()
        animateController.start({
          z: 0,
          rotateX: 0,
          y: 0,
        })
      } catch {
        /* empty */
      }
    }
  }, [isTop, animateController])

  // Exit animation
  const playExitAnimation = useEventCallback(async () => {
    await animateController.start(modalMontionConfig.exit)
  })

  return {
    animateController,
    playNoticeAnimation,
    playExitAnimation,
    isClosing,
    readyToClose: useEventCallback(() => {
      if (isClosing) return // Prevent multiple calls

      setIsClosing(true)
    }),
  }
}
