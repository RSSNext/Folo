import { Spring } from "@follow/components/constants/spring.js"
import { nextFrame } from "@follow/utils/dom"
import { useAnimationControls } from "motion/react"
import { useCallback, useEffect, useLayoutEffect } from "react"
import { useEventCallback } from "usehooks-ts"

import { modalMontionConfig } from "../constants"

export interface ModalAnimateControls {
  /** Controller for modal animations */
  animateController: ReturnType<typeof useAnimationControls>
  /** Play notice animation when modal can't be dismissed */
  playNoticeAnimation: () => void
  /** Play exit animation and return promise that resolves when complete */
  playExitAnimation: () => Promise<void>
}

/**
 * @internal
 * Hook for managing modal animations including enter, notice, and exit animations
 */
export const useModalAnimate = (isTop: boolean): ModalAnimateControls => {
  const animateController = useAnimationControls()

  // Initial enter animation
  useEffect(() => {
    nextFrame(() => {
      animateController.start(modalMontionConfig.animate)
    })
  }, [animateController])

  // Notice animation for when modal can't be dismissed
  const playNoticeAnimation = useCallback(() => {
    animateController
      .start({
        scale: 1.01,
        transition: Spring.snappy(0.06),
      })
      .then(() => {
        animateController.start({
          scale: 1,
        })
      })
  }, [animateController])

  // Stack position animation
  useLayoutEffect(() => {
    if (isTop) return
    animateController.start({
      scale: 0.96,
      y: 10,
    })
    return () => {
      try {
        animateController.stop()
        animateController.start({
          scale: 1,
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
  }
}
