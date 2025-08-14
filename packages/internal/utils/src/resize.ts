export interface ViewportSize {
  width: number
  height: number
}

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Compute new top-left position when resizing from top and/or left so that the
 * opposite corner remains visually anchored. The result is clamped to viewport.
 */
export function computeAdjustedTopLeftPosition(
  previous: RectLike,
  newSize: { width: number; height: number },
  direction: string,
  viewport?: ViewportSize,
): { x: number; y: number } {
  viewport ??= { width: window.innerWidth, height: window.innerHeight }
  const resizedFromLeft = /left/i.test(direction)
  const resizedFromTop = /top/i.test(direction)

  let newX = previous.x
  let newY = previous.y

  if (resizedFromLeft) {
    newX = previous.x - (newSize.width - previous.width)
  }
  if (resizedFromTop) {
    newY = previous.y - (newSize.height - previous.height)
  }

  const maxX = Math.max(0, viewport.width - newSize.width)
  const maxY = Math.max(0, viewport.height - newSize.height)
  newX = Math.min(Math.max(0, newX), maxX)
  newY = Math.min(Math.max(0, newY), maxY)

  return { x: newX, y: newY }
}
