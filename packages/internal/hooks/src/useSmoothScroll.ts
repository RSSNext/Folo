import { useCallback, useRef } from "react"

/**
 *
 * Smooth scroll implementation similar to Vimium
 */
export const useSmoothScroll = () => {
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null)

  return useCallback(
    (targetScrollTop: number, element: HTMLDivElement) => {
      // Stop any existing animation
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }

      const startScrollTop = element.scrollTop
      const distance = targetScrollTop - startScrollTop

      // If distance is very small, just set it directly
      if (Math.abs(distance) < 1) {
        element.scrollTop = targetScrollTop
        scrollAnimationRef.current = null
        return
      }

      // Adaptive duration based on distance - shorter for small distances, longer for large ones
      const baseDuration = 150
      const maxDuration = 300
      const duration = Math.min(maxDuration, baseDuration + Math.abs(distance) * 0.5)
      const startTime = performance.now()

      // Easing function similar to Vimium's smooth scrolling - ease out cubic for natural feel
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3)
      }

      let animationId: number

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        const easedProgress = easeOutCubic(progress)
        const currentScrollTop = startScrollTop + distance * easedProgress

        element.scrollTop = currentScrollTop

        if (progress < 1) {
          animationId = requestAnimationFrame(animateScroll)
          scrollAnimationRef.current = {
            stop: () => {
              cancelAnimationFrame(animationId)
              scrollAnimationRef.current = null
            },
          } as any
        } else {
          scrollAnimationRef.current = null
        }
      }

      animationId = requestAnimationFrame(animateScroll)
    },
    [scrollAnimationRef],
  )
}
