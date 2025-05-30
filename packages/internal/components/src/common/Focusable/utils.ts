// Grok AI
// Interface for keyframe properties
interface HighlightKeyframe {
  shadowWidth: number
  shadowOpacity: number
  outlineWidth: number
  outlineOpacity: number
}

// Cubic-bezier easing function (0.4, 0, 0.2, 1)
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  const cx: number = 3 * p1x
  const bx: number = 3 * (p2x - p1x) - cx
  const ax: number = 1 - cx - bx
  const cy: number = 3 * p1y
  const by: number = 3 * (p2y - p1y) - cy
  const ay: number = 1 - cy - by

  function sampleCurveX(t: number): number {
    return ((ax * t + bx) * t + cx) * t
  }
  function sampleCurveY(t: number): number {
    return ((ay * t + by) * t + cy) * t
  }
  function solveCurveX(x: number): number {
    let t2: number = x
    for (let i = 0; i < 8; i++) {
      const x2: number = sampleCurveX(t2) - x
      if (Math.abs(x2) < 1e-6) return t2
      const d2: number = (3 * ax * t2 + 2 * bx) * t2 + cx
      if (Math.abs(d2) < 1e-6) break
      t2 -= x2 / d2
    }
    return t2
  }
  return sampleCurveY(solveCurveX(t))
}

// Shared canvas element for all highlight operations
let sharedCanvas: HTMLCanvasElement | null = null
let currentAnimationId: number | null = null

export function highlightElement(element: HTMLElement | null, colorString = "255, 165, 0"): void {
  if (!element) return

  // Cancel any ongoing animation
  if (currentAnimationId !== null) {
    cancelAnimationFrame(currentAnimationId)
    currentAnimationId = null
  }

  // Get element's bounding rectangle
  const rect: DOMRect = element.getBoundingClientRect()
  const padding = 10 // Extra space for shadow effect

  // Create or reuse canvas
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas")
    sharedCanvas.style.position = "absolute"
    sharedCanvas.style.pointerEvents = "none"
    sharedCanvas.style.zIndex = "999999"
    sharedCanvas.id = "follow-highlight-canvas"
    document.body.append(sharedCanvas)
  }

  // Update canvas position and size
  sharedCanvas.style.top = `${rect.top + window.scrollY - padding}px`
  sharedCanvas.style.left = `${rect.left + window.scrollX - padding}px`
  sharedCanvas.width = rect.width + padding * 2
  sharedCanvas.height = rect.height + padding * 2

  const ctx: CanvasRenderingContext2D = sharedCanvas.getContext("2d")!
  if (!ctx) {
    return
  }

  const duration = 1000 // 1000ms
  const startTime: number = performance.now()
  const borderRadius = 8 // Border radius for rounded corners

  // Keyframes (mimicking CSS)
  const keyframes: HighlightKeyframe[] = [
    {
      shadowWidth: 4,
      shadowOpacity: 0.8,
      outlineWidth: 1,
      outlineOpacity: 0.5,
    },
    {
      shadowWidth: 2,
      shadowOpacity: 0.4,
      outlineWidth: 1,
      outlineOpacity: 0.3,
    },
    {
      shadowWidth: 0,
      shadowOpacity: 0,
      outlineWidth: 0,
      outlineOpacity: 0,
    },
  ]

  function interpolate(start: number, end: number, factor: number): number {
    return start + (end - start) * factor
  }

  function animate(): void {
    const elapsed: number = performance.now() - startTime
    let t: number = elapsed / duration
    if (t > 1) t = 1

    // Apply cubic-bezier easing
    t = cubicBezier(t, 0.4, 0, 0.2, 1)

    // Determine which keyframe segment we're in
    const segmentDuration: number = 1 / (keyframes.length - 1)
    const segmentIndex: number = Math.floor(t / segmentDuration)
    const segmentT: number = (t - segmentIndex * segmentDuration) / segmentDuration

    if (segmentIndex >= keyframes.length - 1) {
      // Animation complete, hide canvas
      if (sharedCanvas) {
        sharedCanvas.style.display = "none"
      }
      currentAnimationId = null
      return
    }

    const startFrame: HighlightKeyframe = keyframes[segmentIndex]!
    const endFrame: HighlightKeyframe = keyframes[segmentIndex + 1]!

    // Interpolate values
    const shadowWidth: number = interpolate(startFrame.shadowWidth, endFrame.shadowWidth, segmentT)
    const shadowOpacity: number = interpolate(
      startFrame.shadowOpacity,
      endFrame.shadowOpacity,
      segmentT,
    )
    const outlineWidth: number = interpolate(
      startFrame.outlineWidth,
      endFrame.outlineWidth,
      segmentT,
    )
    const outlineOpacity: number = interpolate(
      startFrame.outlineOpacity,
      endFrame.outlineOpacity,
      segmentT,
    )

    // Clear canvas
    ctx.clearRect(0, 0, sharedCanvas!.width, sharedCanvas!.height)

    // Draw shadow (approximated as thick border with rounded corners)
    if (shadowWidth > 0) {
      ctx.strokeStyle = `rgba(${colorString}, ${shadowOpacity})` // Orange color
      ctx.lineWidth = shadowWidth
      ctx.beginPath()
      ctx.roundRect(
        padding + shadowWidth / 2,
        padding + shadowWidth / 2,
        rect.width - shadowWidth,
        rect.height - shadowWidth,
        borderRadius,
      )
      ctx.stroke()
    }

    // Draw outline (with rounded corners)
    if (outlineWidth > 0) {
      ctx.strokeStyle = `rgba(${colorString}, ${outlineOpacity})`
      ctx.lineWidth = outlineWidth
      ctx.beginPath()
      ctx.roundRect(
        padding + outlineWidth / 2,
        padding + outlineWidth / 2,
        rect.width - outlineWidth,
        rect.height - outlineWidth,
        borderRadius,
      )
      ctx.stroke()
    }

    if (t < 1) {
      currentAnimationId = requestAnimationFrame(animate)
    } else {
      if (sharedCanvas) {
        sharedCanvas.style.display = "none"
      }
      currentAnimationId = null
    }
  }

  // Show canvas before starting animation
  if (sharedCanvas) {
    sharedCanvas.style.display = "block"
  }

  currentAnimationId = requestAnimationFrame(animate)
}
