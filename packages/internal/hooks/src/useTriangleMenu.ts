import { useEffect, useState } from "react"

export function useTriangleMenu(
  triggerRef: React.RefObject<HTMLElement>,
  panelRef: HTMLElement,
  openDelay = 100,
) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const $trigger = triggerRef.current
    const $panel = panelRef
    if (!$trigger || !$panel) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let inStartTrack = false
    const mousePath = [] as { x: number; y: number }[]
    function handleMouseMove(event: MouseEvent) {
      const { clientX, clientY } = event

      if (!inStartTrack) return

      mousePath.push({ x: clientX, y: clientY })
      if (mousePath.length > 5) {
        mousePath.shift()
      }

      const triggerRect = $trigger?.getBoundingClientRect()

      if (!triggerRect) return
      const panelRect = $panel.getBoundingClientRect()

      const lastPoint = mousePath[0]

      if (!lastPoint) return

      const inTriangle = isPointInTriangle(
        { x: clientX, y: clientY },
        { x: lastPoint.x, y: lastPoint.y },
        { x: panelRect.left, y: panelRect.top },
        { x: panelRect.left, y: panelRect.bottom },
      )

      if (inTriangle) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => setOpen(true), openDelay)
      } else {
        const inRect =
          isPointInRect(
            { x: clientX, y: clientY },
            {
              x: triggerRect.left,
              y: triggerRect.top,
              width: triggerRect.width,
              height: triggerRect.height,
            },
          ) ||
          isPointInRect(
            { x: clientX, y: clientY },
            {
              x: panelRect.left,
              y: panelRect.top,
              width: panelRect.width,
              height: panelRect.height,
            },
          )

        if (inRect) {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => setOpen(true), openDelay)
        } else {
          if (timer) clearTimeout(timer)
          setOpen(false)
          inStartTrack = false
        }
      }
    }

    function handleMouseEnter() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        inStartTrack = true
        setOpen(true)
      }, openDelay)
    }

    function handleMouseLeave() {
      if (timer) clearTimeout(timer)
      setOpen(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    $trigger.addEventListener("mouseenter", handleMouseEnter)
    $panel.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      $trigger.removeEventListener("mouseenter", handleMouseEnter)
      $panel.removeEventListener("mouseleave", handleMouseLeave)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [triggerRef, panelRef, openDelay])

  return open
}

function isPointInTriangle(
  P: { x: number; y: number },
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number },
) {
  function sign(p1: any, p2: any, p3: any) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  }

  const d1 = sign(P, A, B)
  const d2 = sign(P, B, C)
  const d3 = sign(P, C, A)

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0

  return !(hasNeg && hasPos)
}

function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}
