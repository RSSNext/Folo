import { useRef } from "react"
import { useEventCallback } from "usehooks-ts"

interface UseLongPressOptions {
  onLongPress: (e: { pageX: number; pageY: number; target: EventTarget }) => void
  onClick?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
  onTouchStart?: (e: React.TouchEvent) => void
  threshold?: number
}

/**
 * Only for mobile touch event
 */
export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  ...events
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isLongPress = useRef(false)
  const startPosition = useRef<{ x: number; y: number }>(undefined)

  const onTouchStart = useEventCallback((e: React.TouchEvent) => {
    events.onTouchStart?.(e)
    e.preventDefault()
    isLongPress.current = false
    const touch = e.touches[0]!

    clearTimeout(timerRef.current)
    startPosition.current = {
      x: touch.clientX + window.scrollX,
      y: touch.clientY + window.scrollY,
    }

    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      if (!startPosition.current) return

      const compatEvent = {
        pageX: startPosition.current.x,
        pageY: startPosition.current.y,
        target: e.target,
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
      }
      const compatProperties = new Set([
        "pageX",
        "pageY",
        "target",
        "preventDefault",
        "stopPropagation",
        "clientX",
        "clientY",
      ])

      const compatEventProxy = new Proxy(compatEvent, {
        get: (target, prop: string) => {
          if (compatProperties.has(prop)) {
            return target[prop as keyof typeof target]
          }
          throw new Error(`Property ${prop} not implemented on compatEvent`)
        },
      })

      onLongPress(compatEventProxy)
    }, threshold)
  })

  const onTouchMove = useEventCallback((e: React.TouchEvent) => {
    events.onTouchMove?.(e)
    if (!startPosition.current) return

    const touch = e.touches[0]!
    const currentX = touch.clientX + window.scrollX
    const currentY = touch.clientY + window.scrollY

    const moveOffset = Math.sqrt(
      Math.pow(currentX - startPosition.current.x, 2) +
        Math.pow(currentY - startPosition.current.y, 2),
    )

    if (moveOffset > 10) {
      clearTimeout(timerRef.current)
      startPosition.current = undefined
    }
  })

  const onTouchEnd = useEventCallback((e: React.TouchEvent) => {
    events.onTouchEnd?.(e)
    clearTimeout(timerRef.current)
    if (!isLongPress.current && onClick) {
      onClick(e)
    }
    startPosition.current = undefined
  })

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
