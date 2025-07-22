import type { FC } from "react"
import { useEffect, useRef, useState } from "react"

import { RootPortal } from "../portal"

export interface ShrinkingFocusBorderProps {
  isVisible: boolean
  containerRef: React.RefObject<HTMLElement | null>
  persistBorder?: boolean
  radius?: number
}

export const ShrinkingFocusBorder: FC<ShrinkingFocusBorderProps> = ({
  isVisible,
  containerRef,
  persistBorder = false,
  radius = 6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(undefined)
  const startTimeRef = useRef<number>(undefined)
  const resizeObserverRef = useRef<ResizeObserver>(undefined)
  const [currentRect, setCurrentRect] = useState<DOMRect | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const transitionStartRef = useRef<number>(undefined)
  const previousRectRef = useRef<DOMRect | null>(null)

  // Reset animation state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      previousRectRef.current = null
    } else {
      setIsAnimating(false)
      setCurrentRect(null)
    }
  }, [isVisible])

  // Setup resize observer for persistent border
  useEffect(() => {
    if (!persistBorder || !containerRef.current || !canvasRef.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newRect = entry.target.getBoundingClientRect()
        if (
          currentRect &&
          (Math.abs(newRect.width - currentRect.width) > 1 ||
            Math.abs(newRect.height - currentRect.height) > 1 ||
            Math.abs(newRect.left - currentRect.left) > 1 ||
            Math.abs(newRect.top - currentRect.top) > 1)
        ) {
          previousRectRef.current = currentRect
          setCurrentRect(newRect)
          transitionStartRef.current = Date.now()
        }
      }
    })

    observer.observe(containerRef.current)
    resizeObserverRef.current = observer

    return () => {
      observer.disconnect()
    }
  }, [persistBorder, containerRef, currentRect])

  useEffect(() => {
    if (!isVisible || !containerRef.current || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    // Delay animation start to ensure proper positioning
    const animationTimeout = setTimeout(() => {
      const canvas = canvasRef.current
      const container = containerRef.current

      if (!canvas || !container) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Get fresh rect after DOM has settled
      const rect = container.getBoundingClientRect()
      setCurrentRect(rect)

      // Canvas positioned fixed to viewport
      canvas.width = rect.width + 100
      canvas.height = rect.height + 100

      // Position canvas relative to viewport
      canvas.style.left = `${rect.left - 50}px`
      canvas.style.top = `${rect.top - 50}px`

      startTimeRef.current = Date.now()

      const drawBorder = () => {
        if (!ctx || !canvas) return

        const now = Date.now()
        const elapsed = (now - (startTimeRef.current || 0)) / 1000
        const duration = 0.4 // Animation duration in seconds

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let borderWidth = rect.width
        let borderHeight = rect.height
        let borderX = canvas.width / 2 - borderWidth / 2
        let borderY = canvas.height / 2 - borderHeight / 2

        if (isAnimating) {
          if (elapsed >= duration) {
            // Animation complete
            setIsAnimating(false)
            if (!persistBorder) {
              // Stop animation completely for non-persistent border
              return
            }
            // For persistent border, continue with final dimensions
            borderWidth = rect.width
            borderHeight = rect.height
            borderX = canvas.width / 2 - borderWidth / 2
            borderY = canvas.height / 2 - borderHeight / 2
          } else {
            // Initial shrinking animation in progress
            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = easeOutCubic(progress)

            const startWidth = rect.width + 80
            const startHeight = rect.height + 80

            borderWidth = startWidth - (startWidth - rect.width) * easedProgress
            borderHeight = startHeight - (startHeight - rect.height) * easedProgress
            borderX = canvas.width / 2 - borderWidth / 2
            borderY = canvas.height / 2 - borderHeight / 2
          }
        } else if (persistBorder && previousRectRef.current && transitionStartRef.current) {
          // Resize transition animation
          const transitionElapsed = (now - transitionStartRef.current) / 1000
          const transitionDuration = 0.3

          if (transitionElapsed <= transitionDuration) {
            const progress = Math.min(transitionElapsed / transitionDuration, 1)
            const easeInOutCubic = (t: number) =>
              t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
            const easedProgress = easeInOutCubic(progress)

            const prevRect = previousRectRef.current
            borderWidth = prevRect.width + (rect.width - prevRect.width) * easedProgress
            borderHeight = prevRect.height + (rect.height - prevRect.height) * easedProgress

            // Update canvas position during transition
            const currentLeft = prevRect.left + (rect.left - prevRect.left) * easedProgress
            const currentTop = prevRect.top + (rect.top - prevRect.top) * easedProgress

            canvas.style.left = `${currentLeft - 50}px`
            canvas.style.top = `${currentTop - 50}px`
            canvas.width = borderWidth + 100
            canvas.height = borderHeight + 100

            borderX = canvas.width / 2 - borderWidth / 2
            borderY = canvas.height / 2 - borderHeight / 2

            if (progress >= 1) {
              previousRectRef.current = null
              transitionStartRef.current = undefined
            }
          }
        } else if (persistBorder) {
          // Update canvas position for current rect
          canvas.style.left = `${rect.left - 50}px`
          canvas.style.top = `${rect.top - 50}px`
          canvas.width = rect.width + 100
          canvas.height = rect.height + 100
          borderX = canvas.width / 2 - borderWidth / 2
          borderY = canvas.height / 2 - borderHeight / 2
        }

        // Draw border only if animating or persistBorder is true
        if (isAnimating || persistBorder) {
          // Get dynamic color from CSS variable
          const computedStyle = getComputedStyle(document.documentElement)
          const foColor = computedStyle.getPropertyValue("--fo-a").trim()

          // Parse HSL string (e.g., "21.6 100% 50%") and convert to usable format
          const hslMatch = foColor.match(/^(\d+(?:\.\d+)?)\s+(\d+)%\s+(\d+)%$/)
          let strokeColor = "rgba(59, 130, 246, 0.8)" // fallback
          let shadowColor = "rgba(59, 130, 246, 0.5)" // fallback

          if (hslMatch) {
            const [, h, s, l] = hslMatch
            strokeColor = `hsla(${h}, ${s}%, ${l}%, 0.8)`
            shadowColor = `hsla(${h}, ${s}%, ${l}%, 0.5)`
          }

          // Border style
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = 2
          ctx.shadowColor = shadowColor
          ctx.shadowBlur = 6

          // Draw rounded rectangle border
          ctx.beginPath()
          ctx.roundRect(borderX, borderY, borderWidth, borderHeight, radius)
          ctx.stroke()
        }

        // Continue animation if needed
        if (
          isAnimating ||
          (persistBorder && previousRectRef.current && transitionStartRef.current) ||
          (persistBorder && elapsed > duration)
        ) {
          animationFrameRef.current = requestAnimationFrame(drawBorder)
        }
      }

      drawBorder()
    }, 16) // One frame delay to ensure DOM positioning

    return () => {
      clearTimeout(animationTimeout)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isVisible, containerRef, isAnimating, persistBorder, radius])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  if (!isVisible) return null

  // If not persisting border and animation is complete, don't render
  if (!persistBorder && !isAnimating) return null

  return (
    <RootPortal>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed z-50"
        style={{ borderRadius: `${radius}px` }}
      />
    </RootPortal>
  )
}
